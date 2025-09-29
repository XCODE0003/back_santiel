import { Injectable } from '@nestjs/common'
import { Transaction } from '@prisma/client'

import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class TransactionsService {
    constructor(private readonly prismaService: PrismaService) {}

    async getByWorkerId(
        userId: number,
        typeId: number = 0,
        page: number = 1
    ): Promise<{ transactions: Transaction[]; pages: number }> {
        const pageSize = 25
        const skip = (page - 1) * pageSize
        const take = pageSize

        const totalCount = await this.prismaService.transaction.count({
            where: {
                user: {
                    workerId: userId
                }
            }
        })

        const totalPages = Math.ceil(totalCount / pageSize)

        const transactions = await this.prismaService.transaction.findMany({
            where: {
                user: {
                    workerId: userId
                }
            },
            skip,
            take,
            include: {
                user: {
                    select: {
                        email: true
                    }
                },
                coin: true
            }
        })

        return { transactions, pages: totalPages }
    }

    async getAll(
        typeId: number = 0,
        page: number = 1
    ): Promise<{ transactions: Transaction[]; pages: number }> {
        const pageSize = 25
        const skip = (page - 1) * pageSize
        const take = pageSize

        const totalCount = await this.prismaService.transaction.count()

        const totalPages = Math.ceil(totalCount / pageSize)

        const transactions = await this.prismaService.transaction.findMany({
            skip,
            take,
            include: {
                user: {
                    select: {
                        email: true
                    }
                },
                coin: true
            }
        })

        return { transactions, pages: totalPages }
    }
}
