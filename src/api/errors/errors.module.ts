import { Module } from '@nestjs/common'

import { PrismaModule } from '@/infra/prisma/prisma.module'

import { ErrorsController } from './errors.controller'
import { ErrorsService } from './errors.service'

@Module({
    imports: [PrismaModule],
    controllers: [ErrorsController],
    providers: [ErrorsService]
})
export class ErrorsModule {}
