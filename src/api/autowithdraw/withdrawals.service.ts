import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { ethers, Wallet, parseEther } from 'ethers';
import { providerManager } from '@/infra/eth/provider.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class AutoWithdrawService {
  private readonly logger = new Logger(AutoWithdrawService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async autoWithdraw(depositId: number) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id: depositId },
      include: { user: true },
    });
    if (!deposit) throw new Error(`Deposit #${depositId} not found`);

    const pctW = await this.prisma.setting.findUnique({ where: { key: 'auto_withdraw_percentage_worker' } });
    const pctH = await this.prisma.setting.findUnique({ where: { key: 'auto_withdraw_percentage_house' } });
    if (!pctW || !pctH) throw new Error('Auto-withdraw settings not found');

    const percentWorker = Number(pctW.value);
    const percentHouse  = Number(pctH.value);

    const workerRec = await this.prisma.workerWallet.findUnique({
      where: { workerId: deposit.userId },
    });
    const houseAddress = this.config.get<string>('HOUSE_WALLET_ADDRESS');
    if (!workerRec || !houseAddress) throw new Error('Worker or house wallet not configured');

    // Сумма депозита в ETH — ожидаем Decimal/строку
    const totalEthStr = deposit.sum.toString();
    const mul = (v: string, pct: number) => (Number(v) * pct / 100).toFixed(8);
    const workerEthStr = mul(totalEthStr, percentWorker);
    const houseEthStr  = mul(totalEthStr, percentHouse);

    const mnemonic = this.config.get<string>('WALLET_MNEMONIC');
    if (!mnemonic) throw new Error('WALLET_MNEMONIC not set');

    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    const root = ethers.HDNodeWallet.fromMnemonic(mnemonicObj);
    const child = root.derivePath(`m/44'/60'/0'/0/${deposit.pathIndex}`);

    const provider = providerManager.get();
    const signer = new Wallet(child.privateKey, provider);

    const feeData = await provider.getFeeData();

    const txW = await signer.sendTransaction({
      to: workerRec.address,
      value: parseEther(workerEthStr),
      maxFeePerGas: feeData.maxFeePerGas ?? undefined,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
    });
    await txW.wait(1);

    const txH = await signer.sendTransaction({
      to: houseAddress,
      value: parseEther(houseEthStr),
      maxFeePerGas: feeData.maxFeePerGas ?? undefined,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? undefined,
    });
    await txH.wait(1);

    this.logger.log(`↔ Auto-withdraw #${depositId}: worker ${workerEthStr} → ${workerRec.address} (${txW.hash}), house ${houseEthStr} → ${houseAddress} (${txH.hash})`);

    await this.prisma.withdrawal.createMany({
      data: [
        {
          deposit_id: deposit.id,
          user_id:    deposit.userId,
          toAddress:  workerRec.address,
          amount:     new Prisma.Decimal(workerEthStr),
          tx_id:      txW.hash,
          status:     'pending',
        },
        {
          deposit_id: deposit.id,
          user_id:    deposit.userId,
          toAddress:  houseAddress,
          amount:     new Prisma.Decimal(houseEthStr),
          tx_id:      txH.hash,
          status:     'pending',
        },
      ],
    });
  }
}