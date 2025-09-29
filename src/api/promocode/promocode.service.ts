import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common'

import { LogsService } from '@/api/logs/logs.service'
import { EditPromocodeDto } from '@/api/promocode/dto/edit.dto'
import { GetAllPromocodesDto } from '@/api/promocode/dto/get-all.dto'
import { UserService } from '@/api/user/user.service'
import { PrismaService } from '@/infra/prisma/prisma.service'

import { CreatePromocodeDto } from './dto/create.dto'

@Injectable()
export class PromocodeService {
    constructor(
        private readonly prismaService: PrismaService,
        // TODO: maybe remove these service from here since there's no usage of them
        private readonly userService: UserService,
        private readonly logsService: LogsService
    ) {}

    async getByCode(code: string) {
        if (!code) {
            throw new Error('Code is required')
        }

        return this.prismaService.promocode.findFirst({
            where: {
                code
            }
        })
    }

    async getById(id: number) {
        if (!id) {
            throw new Error('Id is required')
        }

        return this.prismaService.promocode.findUnique({
            where: {
                id
            }
        })
    }

    async getByUserId(userId: number) {
        if (!userId) {
            throw new Error('User is required')
        }

        return this.prismaService.promocode.findMany({
            where: {
                userId
            }
        })
    }

    async getWorkerPromocodes(userId: number, dto: GetAllPromocodesDto) {
        const limit = 25
        const offset = (dto.page - 1) * limit

        if (!userId) {
            throw new BadRequestException('User is required')
        }

        const where = {
            userId,
            ...(dto.search && {
                code: {
                    contains: dto.search
                }
            })
        }

        const promocodes = await this.prismaService.promocode.findMany({
            where,
            include: {
                user: {
                    select: {
                        email: true
                    }
                },
                _count: {
                    select: {
                        activations: true
                    }
                }
            },
            skip: offset,
            take: limit
        })

        const totalCount = await this.prismaService.promocode.count({
            where
        })

        return {
            promocodes,
            pages: Math.ceil(totalCount / limit)
        }
    }

    async getAll(dto: GetAllPromocodesDto) {
        const limit = 25
        const offset = (dto.page - 1) * limit

        const where = {
            ...(dto.search && {
                code: {
                    contains: dto.search
                }
            })
        }

        const promocodes = await this.prismaService.promocode.findMany({
            where,
            include: {
                user: {
                    select: {
                        email: true
                    }
                },
                _count: {
                    select: {
                        activations: true
                    }
                }
            },
            skip: offset,
            take: limit
        })

        const totalCount = await this.prismaService.promocode.count({
            where
        })

        return {
            promocodes,
            pages: Math.ceil(totalCount / limit)
        }
    }

    async isUserOwner(userId: number, promocodeId: number) {
        const findPromocode = await this.prismaService.promocode.findUnique({
            where: {
                id: promocodeId
            }
        })

        if (!findPromocode) {
            throw new Error('Promocode not found')
        }

        return findPromocode.userId === userId
    }

    async edit(dto: EditPromocodeDto) {
        const findPromocode = await this.prismaService.promocode.findUnique({
            where: {
                id: dto.id
            }
        })

        if (!findPromocode) {
            throw new NotFoundException('Промокод не найден')
        }

        try {
            await this.prismaService.promocode.update({
                where: {
                    id: dto.id
                },
                data: {
                    code: dto.code,
                    amount: dto.amount,
                    message: dto.message,
                    isLucky: dto.isLucky
                }
            })
        } catch (e) {
            throw new BadRequestException('Something went wrong')
        }

        return {
            message: 'Промокод успешно обновлен'
        }
    }

    async delete(id: number) {
        const findPromocode = await this.prismaService.promocode.findUnique({
            where: {
                id
            }
        })

        if (!findPromocode) {
            throw new NotFoundException('Промокод не найден')
        }

        try {
            await this.prismaService.promocode.delete({
                where: {
                    id
                }
            })
        } catch (e) {
            throw new BadRequestException('Something went wrong')
        } finally {
            return {
                message: 'Промокод успешно удален'
            }
        }
    }

    async create(userId: number, dto: CreatePromocodeDto) {
        const findPromocode = await this.prismaService.promocode.findFirst({
            where: {
                code: dto.code
            }
        })

        if (findPromocode) {
            throw new BadRequestException('Promocode already exists')
        }

        try {
            await this.prismaService.promocode.create({
                data: {
                    userId: userId,
                    code: dto.code,
                    amount: dto.amount,
                    message: dto.message,
                    isLucky: dto.isLucky
                }
            })
        } catch (e) {
            throw new BadRequestException('Something went wrong')
        }

        return {
            message: 'Промокод успешно добавлен'
        }
    }

    async activate(code: string, userId: number) {
        // const isActivated = await this.prismaService.activation
    }
}
