import { Module } from '@nestjs/common'

import { LogsModule } from '@/api/logs/logs.module'
import { UserModule } from '@/api/user/user.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'

import { PromocodeController } from './promocode.controller'
import { PromocodeService } from './promocode.service'

@Module({
    imports: [UserModule, LogsModule, PrismaModule],
    controllers: [PromocodeController],
    providers: [PromocodeService]
})
export class PromocodeModule {}
