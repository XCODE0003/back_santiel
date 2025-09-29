import { Module } from '@nestjs/common'

import { AccountsService } from './accounts.service'
import { AccountsController } from '@/api/accounts/accounts.controller'
import { PrismaModule } from '@/infra/prisma/prisma.module'

@Module({
    imports: [PrismaModule],
    providers: [AccountsService],
    exports: [AccountsService],
    controllers: [AccountsController]
})
export class AccountsModule {}
