import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common'
import { Authorization } from '@prisma/client'
import { hash } from 'argon2'

import { DomainsService } from '@/api/domains/domains.service'
import { LogsService } from '@/api/logs/logs.service'
import { DismissStaffDto } from '@/api/user/dto/dismiss-staff.dto'
import { GetAllUsersDto } from '@/api/user/dto/get-all'
import { UpdateSettingsDto } from '@/api/user/dto/update-settings.dto'
import { ROLES } from '@/api/user/user.constants'
import { PrismaService } from '@/infra/prisma/prisma.service'

import { AuthDto } from '../auth/dto/auth.dto'

type TLocation = {
    country: string
    city: string
    countryCode: string
}

@Injectable()
export class UserService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly logs: LogsService,
        private readonly domains: DomainsService
    ) {}

    async getBalanceById(id: number) {
        if (id === undefined || id === null) {
            throw new Error('ID is required')
        }

        const user = await this.prismaService.user.findUnique({
            where: {
                id: id
            },
            select: {
                balance: true
            }
        })

        if (!user) {
            throw new Error('User not found')
        }

        return user.balance
    }

    async updateBalanceById(id: number, balance: number) {
        if (id === undefined || id === null) {
            throw new Error('ID is required')
        }

        if (balance < 0) {
            throw new Error('Balance cannot be negative')
        }

        const user = await this.prismaService.user.update({
            where: {
                id: id
            },
            data: {
                balance: balance
            }
        })

        if (!user) {
            throw new Error('User not found')
        }

        return user.balance
    }

    async getById(id: number) {
        if (id === undefined || id === null) {
            throw new Error('ID is required')
        }

        const user = await this.prismaService.user.findUnique({
            where: {
                id: id
            },
            select: {
                id: true,
                email: true,
                balance: true,
                role: true,
                createdAt: true
            }
        })

        if (!user) {
            throw new Error('User not found')
        }

        return user
    }

    async getIdByEmail(email: string) {
        const user = await this.prismaService.user.findUnique({
            where: { email },
            select: {
                id: true
            }
        })

        if (!user) {
            return false
        }

        return user.id
    }

    async getByEmail(email: string) {
        const user = await this.prismaService.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true
            }
        })

        if (!user) {
            return false
        }

        return user
    }

    async create(dto: AuthDto) {
        return this.prismaService.user.create({
            data: {
                email: dto.email,
                password: await hash(dto.password)
            },
            select: {
                id: true,
                email: true,
                role: true,
                balance: true,
                createdAt: true,
                password: false
            }
        })
    }

    async getRole(userId: number): Promise<ROLES> {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
            select: {
                role: true
            }
        })

        if (!user) {
            throw new Error('User not found')
        }

        return user.role as ROLES
    }

    async getActivationPromocode(userId: number): Promise<string | null> {
        const activation = await this.prismaService.activation.findFirst({
            where: {
                userId: userId
            },
            select: {
                promocodeId: true
            }
        })

        if (activation) {
            const findPromocode = await this.prismaService.promocode.findFirst({
                where: {
                    id: activation.promocodeId
                },
                select: {
                    code: true
                }
            })

            return findPromocode?.code || null
        }

        return null
    }

    async getAll(dto: GetAllUsersDto, workerId?: number) {
        const page = dto.page ?? 1
        const limit = 25
        const skip = (page - 1) * limit
        let items = []
        let pages = 0

        if (workerId) {
            items = await this.prismaService.user.findMany({
                select: {
                    id: true,
                    email: true,
                    role: true,
                    balance: true,
                    createdAt: true,
                    domainId: true,
                    authorizations: {
                        select: {
                            countryCode: true,
                            location: true
                        },
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1
                    }
                },
                where: {
                    workerId: workerId,
                    role: ROLES.CLIENT,
                    ...(dto.search && {
                        email: {
                            contains: JSON.stringify(dto.search)
                        }
                    })
                },
                skip: skip,
                take: limit
            })
            pages = await this.prismaService.user.count({
                where: {
                    workerId: workerId,
                    role: ROLES.CLIENT,
                    ...(dto.search && {
                        email: {
                            contains: JSON.stringify(dto.search)
                        }
                    })
                }
            })
        } else {
            items = await this.prismaService.user.findMany({
                select: {
                    id: true,
                    email: true,
                    role: true,
                    balance: true,
                    createdAt: true,
                    domainId: true,
                    authorizations: {
                        select: {
                            countryCode: true,
                            location: true
                        },
                        orderBy: {
                            createdAt: 'desc'
                        },
                        take: 1
                    }
                },
                where: {
                    // role: ROLES.CLIENT,
                    ...(dto.search && {
                        email: {
                            contains: JSON.stringify(dto.search)
                        }
                    })
                },
                skip: skip,
                take: limit
            })
            pages = await this.prismaService.user.count({
                where: {
                    role: ROLES.CLIENT,
                    ...(dto.search && {
                        email: {
                            contains: JSON.stringify(dto.search)
                        }
                    })
                }
            })
        }

        const filteredItems = await Promise.all(
            items.map(async user => ({
                id: user.id,
                email: user.email,
                role: user.role,
                balance: user.balance,
                createdAt: user.createdAt,
                location: user.authorizations[0] || {
                    countryCode: '',
                    location: ''
                },
                promocode: await this.getActivationPromocode(user.id),
                activity: await this.logs.getLastActivityByUserId(user.id),
                domain: await this.domains.getNameById(user.domainId)
            }))
        )

        return { items: filteredItems, pages: Math.ceil(pages / limit) }
    }

    async getStaff(dto: GetAllUsersDto) {
        const limit = 25
        const skip = (dto.page - 1) * limit

        const items = await this.prismaService.user.findMany({
            select: {
                id: true,
                email: true,
                role: true
            },
            where: {
                role: {
                    in: [ROLES.WORKER]
                },
                ...(dto.search && {
                    email: {
                        contains: dto.search
                    }
                })
            },
            skip: skip,
            take: limit
        })

        const pages = await this.prismaService.user.count({
            where: {
                role: {
                    in: [ROLES.ADMIN, ROLES.WORKER]
                },
                ...(dto.search && {
                    email: {
                        contains: JSON.stringify(dto.search)
                    }
                })
            }
        })

        return { items, pages: Math.ceil(pages / limit) }
    }

    async dismissStaff(dto: DismissStaffDto) {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: dto.id
            },
            select: {
                id: true
            }
        })

        if (!user) {
            throw new NotFoundException('Пользователь не найден')
        }

        const role = await this.getRole(user.id)

        if (role === ROLES.CLIENT) {
            throw new BadRequestException('Пользователь уже уволен')
        }

        if (role === ROLES.ADMIN) {
            throw new BadRequestException('Нельзя уволить администратора')
        }

        await this.prismaService.user.update({
            where: {
                id: dto.id
            },
            data: {
                role: ROLES.CLIENT
            }
        })

        return {
            message: 'Сотрудник успешно понижен до клиента'
        }
    }

    async createAuthorization(req: Request, ip: string, id: number) {
        const userIp = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip)
            ? '1.1.1.1'
            : ip
        const locationReq = await fetch(`http://ip-api.com/json/${userIp}`)
        const res = await locationReq.json()
        const { country, city, countryCode }: TLocation = res

        console.log(userIp)

        if (!country || !city) {
            throw new Error('Location not found')
        }

        return this.prismaService.authorization.create({
            data: {
                userId: id,
                device: this.getDevice(req.headers['user-agent']),
                os: this.getOs(req.headers['user-agent']),
                browser: this.getBrowser(req.headers['user-agent']),
                ip: userIp,
                location: `${country}, ${city}`,
                city: city,
                countryCode: countryCode
            }
        })
    }

    private getDevice(userAgent: string) {
        if (userAgent.includes('Mobile')) {
            return 'Mobile'
        } else if (userAgent.includes('Tablet')) {
            return 'Tablet'
        } else if (userAgent.includes('TV')) {
            return 'TV'
        } else {
            return 'Desktop'
        }
    }

    private getOs(userAgent: string) {
        if (userAgent.includes('Windows')) {
            return 'Windows'
        } else if (userAgent.includes('Mac')) {
            return 'Mac'
        } else if (userAgent.includes('Linux')) {
            return 'Linux'
        } else if (userAgent.includes('Android')) {
            return 'Android'
        } else if (userAgent.includes('iOS')) {
            return 'iOS'
        } else {
            return 'Unknown'
        }
    }

    private getBrowser(userAgent: string) {
        if (userAgent.includes('Chrome')) {
            return 'Chrome'
        } else if (userAgent.includes('Firefox')) {
            return 'Firefox'
        } else if (userAgent.includes('Safari')) {
            return 'Safari'
        } else if (userAgent.includes('Opera')) {
            return 'Opera'
        } else if (userAgent.includes('Edge')) {
            return 'Edge'
        } else {
            return 'Unknown'
        }
    }

    async getAuthorizations(
        userId: number,
        page: number = 1
    ): Promise<Authorization[]> {
        const limit = 25
        const skip = (page - 1) * limit

        return this.prismaService.authorization.findMany({
            where: {
                userId: userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: skip,
            take: limit
        })
    }

    async getSettings(userId: number) {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                email: true,
                role: true,
                balance: true,
                createdAt: true,
                domainId: true
            }
        })

        if (!user) {
            throw new NotFoundException('Пользователь не найден')
        }

        return {
            email: user.email,
            balance: user.balance
        }
    }

    async updateSetting(
        userId: number,
        dto: UpdateSettingsDto
    ): Promise<boolean> {
        let currentValue: number | string

        if (dto.key === 'balance')
            currentValue = parseFloat(dto.value as string)
        else currentValue = dto.value

        await this.prismaService.user.update({
            where: {
                id: userId
            },
            data: {
                [dto.key]: currentValue
            }
        })

        return true
    }
}
