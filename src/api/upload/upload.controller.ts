import {
    BadRequestException,
    Controller,
    HttpCode,
    Post,
    UploadedFile,
    UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { existsSync, mkdirSync } from 'fs'
import { diskStorage } from 'multer'
import { basename } from 'path'
import { v4 as uuidv4 } from 'uuid'

import { ROLES } from '@/api/user/user.constants'
import { Auth, CurrentUser } from '@/common/decorators'

import { UploadService } from './upload.service'

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    @Auth(ROLES.CLIENT, ROLES.WORKER, ROLES.ADMIN)
    @HttpCode(200)
    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadDir = './uploads'
                    if (!existsSync(uploadDir)) {
                        mkdirSync(uploadDir, { recursive: true })
                    }
                    cb(null, uploadDir)
                },
                filename: (req, file, cb) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
                    const uniqueName = uuidv4()
                    const ext = basename(file.originalname).split('.').pop()
                    cb(null, `${uniqueName}.${ext}`)
                }
            }),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10mb
            fileFilter: (req, file, cb) => {
                if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                    cb(null, true)
                } else {
                    cb(new BadRequestException('Unsupported file type'), false)
                }
            }
        })
    )
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser('id') id: number
    ) {
        try {
            return await this.uploadService.upload(file, id)
        } catch (e) {
            console.log('Error during file upload:', e)
            throw new BadRequestException('File upload failed: ' + e)
        }
    }
}
