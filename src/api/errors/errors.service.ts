import { Injectable } from '@nestjs/common'
import { Error } from '@prisma/client'

import { EditErrorDto } from '@/api/errors/dto/edit.dto'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class ErrorsService {
    constructor(private readonly prisma: PrismaService) {}

    async getWorkerError(userId: number, errorId: number) {
        return this.prisma.userErrors.findFirst({
            where: {
                userId,
                errorId
            }
        })
    }

    async getWorkersErrors(userId: number) {
        const errors = await this.prisma.error.findMany()

        const items = errors.map(error => {
            return {
                ...error,
                value: this.getWorkerError(userId, error.id) || error.value
            }
        })

        return {
            errors: items
        }
    }

    async getAll(): Promise<{ errors: Error[] }> {
        return {
            errors: await this.prisma.error.findMany()
        }
    }

    async editWorkerError(userId: number, errorId: number, dto: EditErrorDto) {
        const findId = await this.prisma.userErrors.findFirst({
            where: {
                userId,
                errorId
            },
            select: {
                id: true
            }
        })

        if (findId?.id) {
            await this.prisma.userErrors.update({
                where: { id: findId.id },
                data: {
                    value: dto.value
                }
            })
        } else {
            await this.prisma.userErrors.create({
                data: {
                    userId,
                    errorId,
                    value: dto.value
                }
            })
        }

        return {
            message: 'Ошибка успешно обновлена'
        }
    }

    async editError(id: number, dto: EditErrorDto) {
        await this.prisma.error.update({
            where: { id },
            data: {
                value: dto.value
            }
        })

        return {
            message: 'Ошибка успешно обновлена'
        }
    }
}
