// blockchain.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { BlockchainService } from './blockchain.service'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    BlockchainService,
  ],
  exports: [
    BlockchainService,
  ]
})
export class BlockchainModule {}