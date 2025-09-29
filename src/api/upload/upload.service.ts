import { BadRequestException, Injectable } from '@nestjs/common'

import { PrismaService } from '@/infra/prisma/prisma.service'
import { formatPath } from '@/libs/formatPath'

@Injectable()
export class UploadService {
    constructor(private readonly prismaService: PrismaService) {}

    async upload(file: Express.Multer.File, id: number) {
        if (!file) {
            throw new BadRequestException('No file data received')
        }

        const fileUpload = await this.prismaService.upload.create({
            data: {
                userId: id,
                name: file.originalname.toString(),
                size: Number(file.size),
                fileName: file.filename.toString(),
                type: file.mimetype.toString() || '-',
                ext: file.originalname.split('.').pop()?.toString() || '-'
            }
        })

        if (!fileUpload) {
            throw new BadRequestException('File upload failed')
        }

        return {
            message: 'File uploaded successfully',
            file: {
                ...fileUpload,
                url: formatPath(`/${file.filename}`)
            }
        }
    }

    async isOwner(id: number, userId: number) {
        return (
            (await this.prismaService.upload.count({
                where: {
                    id,
                    userId
                }
            })) > 0
        )
    }

    async getById(id: number) {
        return this.prismaService.upload.findUnique({
            where: {
                id
            }
        })
    }
}
