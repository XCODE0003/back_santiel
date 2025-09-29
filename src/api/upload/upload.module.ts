import { Module } from '@nestjs/common'

import { PrismaModule } from '@/infra/prisma/prisma.module'

import { UploadController } from './upload.controller'
import { UploadService } from './upload.service'

@Module({
    // TODO: why do we need here uuid module? we don't use him anywhere
    imports: [/*UuidModule*/ PrismaModule],
    controllers: [UploadController],
    providers: [UploadService],
    exports: [UploadService]
})
export class UploadModule {}
