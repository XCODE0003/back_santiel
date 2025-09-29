import { Module } from '@nestjs/common'

import { PrismaService } from '@/infra/prisma/prisma.service'

// TODO: in future replace this module with https://nestjs-prisma.dev
// TODO: not sure but maybe we should make this module global
@Module({
    providers: [PrismaService],
    exports: [PrismaService]
})
export class PrismaModule {}
