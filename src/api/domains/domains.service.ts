import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable
} from '@nestjs/common'
import { Domain } from '@prisma/client'

import { AccountsService } from '@/api/accounts/accounts.service'
import { AddDomainDto } from '@/api/domains/dto/add.dto'
import { UserService } from '@/api/user/user.service'
import { PrismaService } from '@/infra/prisma/prisma.service'

import { ROLES } from '../user/user.constants'
import { GetDomainsDto } from '@/api/domains/dto/get.dto'
import { EditDomainDto } from '@/api/domains/dto/edit.dto'
import { CloudflareService } from '@/api/cloudflare/cloudflare.service';

@Injectable()
export class DomainsService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly accounts: AccountsService,
        // @NOTE: https://docs.nestjs.com/fundamentals/circular-dependency
        @Inject(forwardRef(() => UserService))
        private readonly users: UserService,
        private readonly cf: CloudflareService
    ) {}

    async add(dto: AddDomainDto) {
        const { domain, accountId, email } = dto
      
        const cfAccount = await this.prismaService.account.findUnique({
          where: { id: accountId }
        })
        if (!cfAccount) throw new BadRequestException(`CF account not found`)
      
        let userId: number | undefined = undefined
        if (email) {
          const partnerId = await this.users.getIdByEmail(email)
          if (!partnerId) throw new BadRequestException(`Partner not found`)
          const role = await this.users.getRole(partnerId)
          if (role !== ROLES.WORKER) throw new BadRequestException(`User not a worker`)
          userId = partnerId
        }
      
        // 1) создаём зону и получаем от неё zoneId + nameServers
        const { zoneId, nameServers } = await this.cf.createZone(
          cfAccount.apiKey,
          domain,
          cfAccount.cfAccountId.toString()
        )
      
        // 2) создаём A-запись для корня (@)
        await this.cf.createDNSRecord(
          cfAccount.apiKey,
          zoneId,
          'A',
          '@',
          process.env.SERVER_IP!     // сюда ваш точный IP сервера
        )
      
        // 3) (опционально) создаём CNAME для www
        await this.cf.createDNSRecord(
          cfAccount.apiKey,
          zoneId,
          'CNAME',
          'www',
          domain
        )
      
        // наконец, сохраняем домен в БД вместе с ns1/ns2/zoneId
        return this.prismaService.domain.create({
          data: {
            domain,
            accountId,
            userId,
            ns1: nameServers[0],
            ns2: nameServers[1],
            zoneId
          }
        })
      }

    async update(domainId: number, dto: EditDomainDto) {
        const { domain, ns1, ns2 } = dto
    
        const domainExist = await this.isExist(domain, domainId)
    
        if (domainExist) {
            throw new BadRequestException(`Домен ${domain} уже существует`)
        }
    
        return this.prismaService.domain.update({
            where: { id: domainId },
            data: { domain, ns1, ns2 }
        })
    }

    async getAll(dto: GetDomainsDto) {
        const limit = 25
        const offset = (dto.page - 1) * limit

        const [total, domains] = await this.prismaService.$transaction([
            this.prismaService.domain.count(),
            this.prismaService.domain.findMany({
                take: limit,
                skip: offset,
                orderBy: {
                    id: 'desc'
                }
            })
        ])

        const pages = Math.ceil(total / limit)

        return {
            items: domains,
            pages
        }
    }

    async create(domain: string) {
        const domainExist = await this.isExist(domain)

        if (domainExist) {
            throw new BadRequestException(`Домен ${domain} уже существует`)
        }

        return this.prismaService.domain.create({
            data: {
                domain
            }
        })
    }

    async getNameById(id: number | null): Promise<string | null> {
        if (!id) return null

        const domain = await this.prismaService.domain.findUnique({
            where: {
                id
            }
        })

        return domain.domain
    }

    async getById(id: number): Promise<Domain> {
        return this.prismaService.domain.findUnique({
            where: {
                id
            }
        })
    }

    async isExist(domain: string, excludeId?: number): Promise<boolean> {
        const existing = await this.prismaService.domain.findFirst({
            where: {
                domain,
                ...(excludeId && {
                    NOT: {
                        id: excludeId
                    }
                })
            }
        })
    
        return !!existing
    }

    async delete(id: number) {
        return this.prismaService.domain.delete({
            where: { id }
        })
    }

    async ensureZone(domainId: number) {
        // 1) Сначала получаем из БД запись
        const existing = await this.prismaService.domain.findUnique({
            where: { id: domainId },
            include: {
              account: true,
            }
          })
        if (!existing) {
          throw new BadRequestException(`Domain #${domainId} not found`)
        }
    
        // 2) Если zoneId уже есть — ничего не делаем
        if (existing.zoneId) {
          return existing
        }
    
        // 3) Иначе создаём зону в Cloudflare
        const { zoneId, nameServers } = await this.cf.createZone(
          existing.account.apiKey,
          existing.domain,
          existing.account.cfAccountId.toString()
        )
    
        // 4) Создаём DNS-записи (A и CNAME)
        await this.cf.createDNSRecord(existing.account.apiKey, zoneId, 'A', '@', process.env.SERVER_IP!)
        await this.cf.createDNSRecord(existing.account.apiKey, zoneId, 'CNAME', 'www', existing.domain)
    
        // 5) Записываем в БД zoneId и nameServers
        return this.prismaService.domain.update({
          where: { id: domainId },
          data: {
            zoneId,
            ns1: nameServers[0],
            ns2: nameServers[1],
          }
        })
      }
}
