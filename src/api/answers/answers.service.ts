import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common'

import { CreateAnswerDto } from '@/api/answers/dto/create.dto'
import { DeleteAnswerDto } from '@/api/answers/dto/delete.dto'
import { EditAnswerDto } from '@/api/answers/dto/edit.dto'
import { GetAnswersDto } from '@/api/answers/dto/get.dto'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class AnswersService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateAnswerDto) {
        try {
            await this.prisma.answer.create({
                data: {
                    name: dto.name,
                    text: dto.text,
                    priority: dto.priority
                }
            })
        } catch (error) {
            throw new BadRequestException(
                'При создании ответа произошла ошибка'
            )
        }

        return {
            message: 'Ответ успешно создан'
        }
    }

    async getAll(dto: GetAnswersDto) {
        const limit = 10
        const offset = (dto.page - 1) * limit

        const items = await this.prisma.answer.findMany({
            skip: offset,
            take: limit,
            orderBy: {
                priority: 'asc'
            }
        })

        const pages = await this.prisma.answer.count()

        return {
            items,
            pages: Math.ceil(pages / limit)
        }
    }

    async update(dto: EditAnswerDto) {
        try {
            await this.prisma.answer.update({
                where: {
                    id: dto.id
                },
                data: {
                    name: dto.name,
                    text: dto.text,
                    priority: dto.priority
                }
            })
        } catch (error) {
            throw new BadRequestException(
                'При обновлении ответа произошла ошибка'
            )
        }

        return {
            message: 'Ответ успешно обновлён'
        }
    }

    async deleteById(dto: DeleteAnswerDto) {
        const findedAnswer = await this.prisma.answer.count({
            where: {
                id: dto.id
            }
        })

        if (!findedAnswer) {
            throw new NotFoundException('Ответ не найден')
        }

        try {
            await this.prisma.answer.delete({
                where: {
                    id: dto.id
                }
            })
        } catch (error) {
            throw new BadRequestException(
                'При удалении ответа произошла ошибка'
            )
        }

        return {
            message: 'Ответ успешно удалён'
        }
    }
}
