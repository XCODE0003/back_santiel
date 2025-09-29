import { Module } from '@nestjs/common'

import { PrismaModule } from '@/infra/prisma/prisma.module'

import { AnswersController } from './answers.controller'
import { AnswersService } from './answers.service'

@Module({
    imports: [PrismaModule],
    controllers: [AnswersController],
    providers: [AnswersService]
})
export class AnswersModule {}
