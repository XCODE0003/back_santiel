import { Injectable } from '@nestjs/common'
import { Log } from '@prisma/client'

import { LOGS_TYPES } from '@/api/logs/logs.constants'
import { PrismaService } from '@/infra/prisma/prisma.service'

@Injectable()
export class LogsService {
    constructor(private readonly prisma: PrismaService) {}

    async getByWorkerId(
        userId: number,
        page: number = 1
    ): Promise<{ logs: Log[]; totalPages: number }> {
        const pageSize = 25
        const skip = (page - 1) * pageSize
        const take = pageSize

        const totalCount = await this.prisma.log.count({
            where: {
                userId: userId,
                typeId: LOGS_TYPES.CLIENT,
                user: {
                    workerId: userId
                }
            }
        })

        const totalPages = Math.ceil(totalCount / pageSize)

        const logs = await this.prisma.log.findMany({
            where: {
                userId: userId,
                typeId: LOGS_TYPES.CLIENT,
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
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return { logs, totalPages }
    }

    async getLastActivityByUserId(userId: number): Promise<Date | null> {
        const log = await this.prisma.log.findFirst({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        if (log) {
            return log.createdAt
        }

        return null
    }

    async getLastByUserId(userId: number): Promise<string | null> {
        const log = await this.prisma.log.findFirst({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        if (log) {
            return log.action
        }

        return null
    }

    async getAll(page: number = 1): Promise<{ logs: Log[]; pages: number }> {
        const limit = 50
        const skip = (page - 1) * limit
        const take = limit
    
        const totalCount = await this.prisma.log.count()
    
        const pages = Math.ceil(totalCount / limit)
    
        const logs = await this.prisma.log.findMany({
            skip,
            take,
            where: {
                typeId: LOGS_TYPES.CLIENT
            },
            include: {
                user: {
                    select: {
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    
        return { logs, pages }
    }

    async add(type: 'client' | 'admin', userId: number, action: string) {
        return this.prisma.log.create({
            data: {
                userId: userId,
                typeId: type === 'client' ? 0 : 1,
                action: action
            }
        })
    }
}
