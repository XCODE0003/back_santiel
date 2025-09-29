import { Module } from '@nestjs/common'

import { PrismaModule } from '@/infra/prisma/prisma.module'

import { SeedsController } from './seeds.controller'
import { SeedsService } from './seeds.service'

@Module({
    imports: [PrismaModule],
    controllers: [SeedsController],
    providers: [SeedsService]
})
export class SeedsModule {}
