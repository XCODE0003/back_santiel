import { Module } from '@nestjs/common'
import { WithdrawalsController } from './withdrawals.controller'
import { AutoWithdrawService } from './withdrawals.service'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { BlockchainModule } from '@/common/services/blockchain.module'

@Module({
  imports: [BlockchainModule],
  controllers: [WithdrawalsController],
  providers: [AutoWithdrawService, PrismaService],
  exports: [AutoWithdrawService],
})
export class WithdrawalsModule {}