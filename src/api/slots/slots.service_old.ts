import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Cron, CronExpression } from '@nestjs/schedule'
import { NotFoundError } from 'rxjs'
import { v4 as uuidv4 } from 'uuid'

import { LogsService } from '@/api/logs/logs.service'
import { EditSlotDto } from '@/api/slots/dto/edit.dto'
import { GetAllSlotsDto } from '@/api/slots/dto/get-all.dto'
import { WebhookUpdateDto } from '@/api/slots/dto/webhook-update.dto'
import { ISlot } from '@/api/slots/slots.types'
import { UserService } from '@/api/user/user.service'
import { EventsService } from '@/events/events.service'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { formatPath } from '@/libs/formatPath'

@Injectable()
export class SlotsService {
    private readonly baseUrl = this.config.get<string>('SLOTS_API_ENDPOINT')

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly user: UserService,
        private readonly jwt: JwtService,
        private readonly logs: LogsService,
        private readonly events: EventsService
    ) {}

    async onModuleInit() {
        //await this.parse()
    }

    async startSession(userId: number, slotId: number) {
        const sessionId = uuidv4()

        await this.prisma.slotSession.create({
            data: {
                userId: userId,
                slotId: slotId,
                sessionId: sessionId
            }
        })

        return sessionId
    }

    async updateSession(dto: WebhookUpdateDto) {
        const session = await this.prisma.slotSession.findFirst({
            where: {
                sessionId: dto.sessionId
            },
            select: {
                id: true,
                userId: true
            }
        })

        if (!session) {
            throw new NotFoundError('Session not found')
        }

        await this.user.updateBalanceById(session.userId, dto.balance)

        this.events.updateUserBalance(session.userId, dto.balance)

        return {
            message: 'Session updated'
        }
    }

    async getLinkBySlug(slug: string, userId: number) {
        const slot = await this.prisma.slot.findFirst({
            where: {
                slug,
                isActive: true
            },
            select: {
                id: true,
                link: true,
                name: true
            }
        })

        if (!slot) {
            throw new NotFoundException('Slot not found')
        }

        const session = await this.startSession(userId, slot.id)
        const balance = await this.user.getBalanceById(userId)

        const data = {
            key: session,
            userId: userId,
            balance: String(balance)
        }

        const jwt = this.jwt.sign(data, {
            secret: this.config.get<string>('SLOTS_API_SECRET'),
            expiresIn: '24h'
        })

        await this.logs.add('client', userId, `Открыл слот ${slot.name}`)

        return {
            link: `${slot.link}?payload=${jwt}`
        }
    }

    async getAllActive(dto: GetAllSlotsDto) {
        const limit = 25
        const page = (dto.page - 1) * limit

        let slots = await this.prisma.slot.findMany({
            select: {
                id: true,
                publicId: true,
                name: true,
                slug: true,
                link: true,
                image: {
                    select: {
                        fileName: true
                    }
                }
            },
            where: {
                isActive: true
            },
            skip: page,
            take: limit
        })

        const filteredSlots = slots.map(slot => {
            return {
                ...slot,
                image: slot.image ? formatPath(slot.image.fileName) : null
            }
        })

        const pages = await this.prisma.slot.count({
            where: {
                isActive: true
            }
        })

        return {
            items: filteredSlots,
            pages: Math.ceil(pages / limit),
            count: pages
        }
    }

    async getAll(dto: GetAllSlotsDto) {
        const limit = 25
        const page = (dto.page - 1) * limit

        let slots

        if (dto.search) {
            slots = await this.prisma.slot.findMany({
                select: {
                    id: true,
                    publicId: true,
                    name: true,
                    slug: true,
                    link: true,
                    isActive: true,
                    image: {
                        select: {
                            fileName: true
                        }
                    }
                },
                where: {
                    OR: [
                        {
                            name: {
                                contains: dto.search
                            }
                        },
                        {
                            slug: {
                                contains: dto.search
                            }
                        }
                    ]
                },
                skip: page,
                take: limit
            })
        } else {
            slots = await this.prisma.slot.findMany({
                select: {
                    id: true,
                    publicId: true,
                    name: true,
                    slug: true,
                    link: true,
                    isActive: true,
                    image: {
                        select: {
                            fileName: true
                        }
                    }
                },
                skip: page,
                take: limit
            })
        }

        slots = slots.map(slot => {
            return {
                ...slot,
                image: slot.imageUpload
                    ? formatPath(slot.imageUpload.fileName)
                    : null
            }
        })

        const pages = await this.prisma.slot.count()

        return { items: slots, pages: Math.ceil(pages / limit) }
    }

    async editActive(slotId: number, isActive: boolean) {
        const slot = await this.prisma.slot.findFirst({
            where: {
                id: slotId
            }
        })

        if (!slot) {
            throw new NotFoundException('Выбранный слот не найден')
        }

        await this.prisma.slot.update({
            where: {
                id: slotId
            },
            data: {
                isActive
            }
        })

        return {
            message: 'Слот успешно обновлен'
        }
    }

    async getBySlug(slug: string) {
        const slot = await this.prisma.slot.findFirst({
            where: {
                slug
            }
        })

        return {
            slot: slot
        }
    }

    async editById(id: number, dto: EditSlotDto) {
        if (dto.imageId) {
            const isExists = await this.prisma.upload.count({
                where: {
                    id: dto.imageId
                }
            })

            if (!isExists) {
                new NotFoundException('Изображение не найдено')
            }
        }

        const slot = await this.prisma.slot.findFirst({
            where: {
                id
            }
        })

        if (!slot) {
            throw new NotFoundException('Slot not found')
        }

        const imageId = dto.imageId

        await this.prisma.slot.update({
            where: {
                id
            },
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                image: {
                    connect: {
                        id: imageId
                    }
                }
            }
        })

        return {
            message: 'Слот успешно обновлен'
        }
    }

    private async isSlotExists(publicId: number): Promise<boolean> {
        const slot = await this.prisma.slot.count({
            where: {
                publicId
            }
        })

        return !!slot
    }

    //@Cron(CronExpression.EVERY_30_MINUTES)
    private async parse() {
        const req = await fetch(`${this.baseUrl}/slots/list`)

        if (!req.ok) {
            throw new Error(`HTTP error! Status: ${req.status}`)
        }

        const slots: ISlot[] = await req.json()

        slots.map(async slot => {
            const isExists = await this.isSlotExists(slot.id)

            if (slot.typeId === 'slot' && !isExists) {
                await this.prisma.slot.create({
                    data: {
                        publicId: slot.id,
                        name: slot.slug,
                        slug: slot.name,
                        link: slot.url
                    }
                })
            }
        })
    }
}
