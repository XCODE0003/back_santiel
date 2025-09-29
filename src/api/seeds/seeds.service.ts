import { Injectable, NotFoundException } from '@nestjs/common'

import { DeleteSeedDto } from '@/api/seeds/dto/delete.dto'
import { GetAllSeedsDto } from '@/api/seeds/dto/get-all.dto'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class SeedsService {
    constructor(private readonly prisma: PrismaService) {}

    async getAll(dto: GetAllSeedsDto) {
        const limit = 25
        const offset = (dto.page - 1) * limit

        const seeds = await this.prisma.seed.findMany({
            include: {
                user: {
                    select: {
                        email: true
                    }
                }
            },
            skip: offset,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        })

        const pages = await this.prisma.seed.count()

        return {
            seeds,
            pages: Math.ceil(pages / limit)
        }
    }

    async remove(dto: DeleteSeedDto) {
        const seed = await this.prisma.seed.findUnique({
            where: {
                id: dto.id
            }
        })

        if (!seed) {
            throw new NotFoundException('Сид фраза не найден')
        }

        await this.prisma.seed.delete({
            where: {
                id: dto.id
            }
        })

        return {
            message: 'Сид фраза удалена'
        }
    }
}
