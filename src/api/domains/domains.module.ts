import { forwardRef, Module } from '@nestjs/common'

import { AccountsModule } from '@/api/accounts/accounts.module'
import { UserModule } from '@/api/user/user.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { CloudflareModule } from '@/api/cloudflare/cloudflare.module'

import { DomainsController } from './domains.controller'
import { DomainsService } from './domains.service'

@Module({
    imports: [PrismaModule, AccountsModule, forwardRef(() => UserModule), CloudflareModule],
    controllers: [DomainsController],
    providers: [DomainsService],
    exports: [DomainsService]
})
export class DomainsModule {}
