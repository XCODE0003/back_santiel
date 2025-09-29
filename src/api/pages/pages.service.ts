import { Injectable } from '@nestjs/common'
import { Page } from '@prisma/client'

import { CreatePageDto } from '@/api/pages/dto/create.dto'
import { EditPagesQueryDto } from '@/api/pages/dto/edit.dto'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class PagesService {
    constructor(private readonly prismaService: PrismaService) {}

    async create(dto: CreatePageDto): Promise<Page> {
        return this.prismaService.page.create({
            data: {
                title: dto.title,
                path: dto.path,
                content: dto.content
            }
        })
    }

    async getAll(): Promise<Page[]> {
        return this.prismaService.page.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })
    }

    async edit(queryDto: EditPagesQueryDto, dto: CreatePageDto) {
        return this.prismaService.page.update({
            where: {
                id: queryDto.id
            },
            data: {
                title: dto.title,
                path: dto.path,
                content: dto.content
            }
        })
    }

    async delete(queryDto: EditPagesQueryDto) {
        return this.prismaService.page.delete({
            where: {
                id: queryDto.id
            }
        })
    }
}
