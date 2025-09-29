// back/src/api/deposits/deposit-monitor.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { JsonRpcProvider, TransactionResponse, TransactionReceipt, formatEther } from 'ethers';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AutoWithdrawService } from '@/api/autowithdraw/withdrawals.service';

@Injectable()
export class DepositMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DepositMonitorService.name);
  private provider: JsonRpcProvider;
  private readonly CONFIRMATIONS = 3;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly autoWithdraw: AutoWithdrawService,  // inject автовывод
  ) {
    const rpcUrl = this.config.get<string>('RPC_URL');
    this.provider = new JsonRpcProvider(rpcUrl);
  }

  async onModuleInit() {
    this.logger.log('🚀 Starting block monitor...');
    // на каждый новый блок будет вызываться handleNewBlock
    this.provider.on('block', this.handleNewBlock.bind(this));
  }

  async onModuleDestroy() {
    this.logger.log('🛑 Stopping block monitor...');
    this.provider.removeAllListeners();
  }

  private async handleNewBlock(blockNumber: number) {
    const block = await this.provider.getBlock(blockNumber, true);
    if (!block || !block.transactions) return;

    const deposits = await this.prisma.deposit.findMany({
      where: { status: 'pending' },
      select: { address: true },
    });
    const known = new Set(deposits.map(d => d.address.toLowerCase()));

    for (const txHash of block.transactions) {
      // txHash — это строка
      const tx = await this.provider.getTransaction(txHash)
      // проверяем, что tx !== null и что у него есть свойство to
      if (!tx || !tx.to) continue
  
      const to = tx.to.toLowerCase()
      if (!known.has(to)) continue
  
      await this.handleIncomingTx(tx)
    }
  }

  private async handleIncomingTx(tx: TransactionResponse) {
    // ждём N подтверждений
    const receipt: TransactionReceipt = await tx.wait(this.CONFIRMATIONS);
    const to = tx.to!.toLowerCase();

    // находим депозит по адресу и статусу pending
    const deposit = await this.prisma.deposit.findFirst({
      where: { address: to, status: 'pending' },
    });
    if (!deposit) return;

    // обновляем запись депозита: txId + статус
    await this.prisma.deposit.update({
      where: { id: deposit.id },
      data: { txId: tx.hash, status: 'confirmed' },
    });

    // увеcтляем баланс пользователя
    const amountEther = formatEther(tx.value);
    const amountRaw   = tx.value.toString();
    await this.prisma.user.update({
      where: { id: deposit.userId },
      data: { balance: { increment: amountEther } },
    });

    this.logger.log(`💰 Deposit received: ${amountEther} ETH → ${tx.to}`);

    // запускаем автовывод
    this.autoWithdraw.autoWithdraw(deposit.id).catch(err => {
      this.logger.error(`Auto-withdraw failed for deposit #${deposit.id}: ${err.message}`);
    });
  }
}
