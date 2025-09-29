import { Module } from '@nestjs/common'

import { PrismaModule } from '@/infra/prisma/prisma.module'

import { ConfigsController } from './configs.controller'
import { ConfigsService } from './configs.service'

@Module({
    imports: [PrismaModule],
    controllers: [ConfigsController],
    providers: [ConfigsService]
})
export class ConfigsModule {}
