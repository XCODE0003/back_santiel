import { Module } from '@nestjs/common'

import { PrismaModule } from '@/infra/prisma/prisma.module'

import { CoinsController } from './coins.controller'
import { CoinsService } from './coins.service'

@Module({
    imports: [PrismaModule],
    controllers: [CoinsController],
    providers: [CoinsService]
})
export class CoinsModule {}
