import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { formatEther } from 'ethers';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { providerManager } from '@/infra/eth/provider.util';

const CONFIRMATION_THRESHOLD = 3;
const MAX_TX_PER_BLOCK = 10;
const SLEEP_BETWEEN_TX_MS = 150;

@Injectable()
export class RpcListenerService implements OnModuleInit {
  private readonly logger = new Logger(RpcListenerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('📡 Subscribed to Ethereum provider...');
    this.pollBlocks().catch((e) => this.logger.error('pollBlocks crashed', e));
  }

  private async pollBlocks() {
    let provider = providerManager.get();
    let last = await provider.getBlockNumber();
    this.logger.log(`▶ Start from tip: ${last}`);

    for (;;) {
      try {
        provider = providerManager.get();
        const current = await provider.getBlockNumber();

        if (current > last) {
          for (let b = last + 1; b <= current; b++) {
            await this.processBlock(provider, b);
          }
          last = current;
        }
      } catch (e) {
        // при rate-limit/5xx — ротация RPC и увеличенная пауза
        if (providerManager.shouldRotateOn(e)) {
          provider = providerManager.rotate();
          this.logger.warn('RPC rotated due to rate-limit/remote error');
          await this.sleep(5000);
        } else {
          this.logger.warn('poll error; sleep 1500ms');
          await this.sleep(1500);
        }
      }
      await this.sleep(1200);
    }
  }

  private async processBlock(provider: any, blockNumber: number) {
    this.logger.log(`🔍 New block: ${blockNumber}`);
    const block = await provider.getBlock(blockNumber, false);
    if (!block || !block.transactions?.length) return;

    const hashes = block.transactions.slice(0, MAX_TX_PER_BLOCK);
    for (const hash of hashes) {
      try {
        const tx = await provider.getTransaction(hash);
        await this.handleTransaction(provider, tx);
        await this.sleep(SLEEP_BETWEEN_TX_MS);
      } catch (err) {
        this.logger.error(`⚠️ Failed to fetch tx: ${hash}`, err);
      }
    }
  }

  private async handleTransaction(provider: any, tx: any) {
    if (!tx) return;

    const to = tx.to?.toLowerCase();
    if (!to) return;

    const valueStr = formatEther(tx.value ?? 0n);
    if (valueStr === '0.0') return;

    const deposit = await this.prisma.deposit.findFirst({
      where: { address: to, status: 'pending' },
    });
    if (!deposit) return;

    const receipt = await provider.getTransactionReceipt(tx.hash);
    if (!receipt || receipt.blockNumber == null) return;

    const tip = await provider.getBlockNumber();
    const confirmations = tip - receipt.blockNumber + 1;
    if (confirmations < CONFIRMATION_THRESHOLD) return;

    await this.prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        txId: tx.hash,
        amount: valueStr, // храните как Decimal/строку
        status: 'confirmed',
      },
    });

    // ⚠️ Если поле balance — Decimal, лучше так:
    // import { Prisma } from '@prisma/client'
    // balance: { increment: new Prisma.Decimal(valueStr) }
    await this.prisma.user.update({
      where: { id: deposit.userId },
      data: { balance: { increment: valueStr as any } },
    });

    this.logger.log(`✅ Confirmed deposit to ${to}: ${valueStr} ETH (tx=${tx.hash})`);
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}