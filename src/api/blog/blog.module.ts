import { Module } from '@nestjs/common'

import { BlogController, BlogService } from '@/api'
import { UploadModule } from '@/api/upload/upload.module'
import { PrismaModule } from '@/infra/prisma/prisma.module'

@Module({
    imports: [PrismaModule, UploadModule],
    controllers: [BlogController],
    providers: [BlogService]
})
export class BlogModule {}
