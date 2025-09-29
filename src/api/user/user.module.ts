import { Module } from '@nestjs/common'

import { DomainsModule } from '@/api/domains/domains.module'
import { LogsModule } from '@/api/logs/logs.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'

import { UserService } from './user.service'
import { UserController } from '@/api/user/user.controller'

@Module({
    controllers: [UserController],
    imports: [LogsModule, PrismaModule, DomainsModule],
    providers: [UserService],
    exports: [UserService]
})
export class UserModule {}
