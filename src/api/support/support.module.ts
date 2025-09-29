import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { LogsModule } from '@/api/logs/logs.module'
import { UploadModule } from '@/api/upload/upload.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'

import { SupportController } from './support.controller'
import { SupportService } from './support.service'
import { SupportGateway } from './support.gateway'
import { LlmService } from './llm.service'

@Module({
    imports: [PrismaModule, LogsModule, UploadModule, HttpModule],
    controllers: [SupportController],
    providers: [SupportService, SupportGateway, LlmService],
})
export class SupportModule {}
