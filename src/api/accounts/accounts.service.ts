import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common'

import { CreateAccountDto } from '@/api/accounts/dto/create.dto'
import { DeleteAccountDto } from '@/api/accounts/dto/delete.dto'
import { EditAccountDto } from '@/api/accounts/dto/edit.dto'
import { GetAccountsDto } from '@/api/accounts/dto/get.dto'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class AccountsService {
    constructor(private readonly prisma: PrismaService) {}

    async isExist(id: number): Promise<boolean> {
        const account = await this.prisma.account.count({
            where: {
                id
            }
        })

        return !!account
    }

    async getItems() {
        const items = await this.prisma.account.findMany({
            select: {
                id: true,
                email: true
            },
            orderBy: {
                id: 'desc'
            }
        })

        return {
            items: items.map(item => ({
                label: item.email,
                value: item.id
            }))
        }
    }

    async getAll(dto: GetAccountsDto) {
        const limit = 25
        const offset = (dto.page - 1) * limit

        const where = dto.search
            ? {
                  email: {
                      contains: dto.search
                  }
              }
            : {}

        const [items, total] = await this.prisma.$transaction([
            this.prisma.account.findMany({
                where,
                skip: offset,
                take: limit
            }),
            this.prisma.account.count({
                where
            })
        ])

        const pages = Math.ceil(total / limit)

        return {
            items,
            pages
        }
    }

    async create(dto: CreateAccountDto): Promise<void> {
        const findAccount = await this.prisma.account.count({
            where: {
                email: dto.email
            }
        })

        if (findAccount) {
            throw new BadRequestException('Аккаунт с такой почтой уже добавлен')
        }

        try {
            await this.prisma.account.create({
                data: {
                    email: dto.email,
                    apiKey: dto.apiKey,
                    cfAccountId: dto.cfAccountId
                }
            })
        } catch (error) {
            throw new BadRequestException(
                'Произошла ошибка при создании аккаунта'
            )
        }
    }

    async edit(dto: EditAccountDto) {
        const { id, email, apiKey } = dto

        const findAccount = await this.prisma.account.findUnique({
            where: {
                id
            }
        })

        if (!findAccount) {
            throw new NotFoundException('Аккаунт не найден')
        }

        try {
            await this.prisma.account.update({
                where: {
                    id
                },
                data: {
                    email,
                    apiKey,
                }
            })
        } catch (error) {
            throw new BadRequestException(
                'Произошла ошибка при редактировании аккаунта'
            )
        }
    }

    async delete(dto: DeleteAccountDto) {
        const { id } = dto

        const findAccount = await this.prisma.account.findUnique({
            where: {
                id
            }
        })

        if (!findAccount) {
            throw new NotFoundException('Аккаунт не найден')
        }

        try {
            await this.prisma.account.delete({
                where: {
                    id
                }
            })
        } catch (error) {
            throw new BadRequestException(
                'Произошла ошибка при удалении аккаунта'
            )
        }
    }
}
