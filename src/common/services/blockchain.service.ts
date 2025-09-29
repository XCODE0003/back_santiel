import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, JsonRpcProvider, parseEther } from 'ethers';
import { providerManager } from '@/infra/eth/provider.util';

const MAX_RETRIES = 3;

@Injectable()
export class BlockchainService implements OnModuleDestroy {
  private readonly logger = new Logger(BlockchainService.name);

  private workerPrivateKey: string;
  private housePrivateKey: string;

  constructor(private readonly config: ConfigService) {
    // Ключи берём один раз, а провайдер – всегда “живой” из providerManager
    this.workerPrivateKey = this.config.get<string>('WORKER_PRIVATE_KEY')!;
    this.housePrivateKey  = this.config.get<string>('HOUSE_PRIVATE_KEY')!;
    if (!this.workerPrivateKey) throw new Error('WORKER_PRIVATE_KEY is not defined');
    if (!this.housePrivateKey)  throw new Error('HOUSE_PRIVATE_KEY is not defined');
  }

  /** Получаем актуальный провайдер и привязываем кошельки на лету */
  private getProvider(): JsonRpcProvider {
    return providerManager.get(); // внутри уже chainId=1 и ротация при ошибках
  }

  private getWorkerWallet(): ethers.Wallet {
    return new ethers.Wallet(this.workerPrivateKey, this.getProvider());
  }

  private getHouseWallet(): ethers.Wallet {
    return new ethers.Wallet(this.housePrivateKey, this.getProvider());
  }

  /** Отправка транзакции с воркер-кошелька (с ретраями и ротацией RPC) */
  async sendWorkerTransaction(to: string, amountEther: string): Promise<string> {
    const signer = this.getWorkerWallet();
    return this.sendWithRetry(signer, to, amountEther, 'Worker');
  }

  /** Отправка транзакции с домашнего кошелька (с ретраями и ротацией RPC) */
  async sendHouseTransaction(to: string, amountEther: string): Promise<string> {
    const signer = this.getHouseWallet();
    return this.sendWithRetry(signer, to, amountEther, 'House');
  }

  /** Универсальная отправка с backoff, ротацией RPC и EIP-1559 fee */
  private async sendWithRetry(
    signer: ethers.Wallet,
    to: string,
    amountEther: string,
    label: 'Worker' | 'House',
  ): Promise<string> {
    let attempt = 0;

    while (true) {
      const provider = this.getProvider();

      try {
        // Подгружаем комиссии EIP-1559; fallback на undefined — пускай узел проставит сам
        const feeData = await provider.getFeeData();

        const tx = await signer.sendTransaction({
          to,
          value: parseEther(amountEther),
          maxFeePerGas:        feeData.maxFeePerGas ?? undefined,
          maxPriorityFeePerGas:feeData.maxPriorityFeePerGas ?? undefined,
        });

        this.logger.log(`${label} → ${to}: ${amountEther} ETH, txHash=${tx.hash}`);
        await tx.wait(1);
        return tx.hash;

      } catch (e: any) {
        attempt += 1;

        // Если это rate-limit/удалённая ошибка — ротируем RPC и пробуем снова
        if (providerManager.shouldRotateOn(e) && attempt < MAX_RETRIES) {
          providerManager.rotate();
          this.logger.warn(
            `${label} tx: rate/remote error, rotate RPC and retry ${attempt}/${MAX_RETRIES}`,
          );
          await this.sleep(1500 * attempt); // лёгкий backoff
          // Важно: при ротации создадим нового signer на следующей итерации
          signer = label === 'Worker' ? this.getWorkerWallet() : this.getHouseWallet();
          continue;
        }

        // Подсказываем, если банальная причина
        if (String(e?.code) === 'INSUFFICIENT_FUNDS') {
          this.logger.error(`${label} wallet has insufficient funds for amount+gas`);
        }

        this.logger.error(`${label} tx failed (attempt ${attempt}):`, e);
        if (attempt >= MAX_RETRIES) throw e;

        await this.sleep(1000 * attempt);
      }
    }
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /** В v6 у JsonRpcProvider есть destroy, но мы держим провайдер через providerManager */
  async onModuleDestroy() {
    try {
      // Если хочешь явно закрыть текущий провайдер:
      providerManager.get().destroy?.();
    } catch {}
  }
}