import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { URLSearchParams } from 'url'

import { LogsService } from '@/api/logs/logs.service'
import { EditSlotDto } from '@/api/slots/dto/edit.dto'
import { GetAllSlotsDto } from '@/api/slots/dto/get-all.dto'
import { WebhookUpdateDto } from '@/api/slots/dto/webhook-update.dto'
import { UserService } from '@/api/user/user.service'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { GameLogicService } from '@/api/game-logic/game-logic.service'

interface CreateSessionResponse {
    session_id: string
    game_id: string
    balance: number
    status: string
}

interface SlotListItem {
    id: number
    slug: string
    name: string
    link: string
    image: string | null
}

interface SlotListResponse {
    items: SlotListItem[]
    pages: number
    count: number
}

@Injectable()
export class SlotsService {
    private readonly externalBaseUrl = 'https://slots.stfulltest.xyz'

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly user: UserService,
        private readonly logs: LogsService,
        private readonly jwt: JwtService,
        private readonly gameLogic: GameLogicService
    ) {}

    async startSession(userId: number, slug: string) {
        // 1) находим слот
        const slot = await this.prisma.slot.findFirst({
          where: { slug, isActive: true },
          select: { id: true, slug: true, name: true, link: true },
        })
        if (!slot) throw new NotFoundException('Slot not found')
    
        // 2) баланс
        const balanceDecimal = await this.user.getBalanceById(userId)
        const balance = typeof balanceDecimal === 'number'
          ? balanceDecimal
          : balanceDecimal.toNumber()
    
        // 3) создаём сессию у внешнего провайдера
        const createRes = await fetch(`${this.externalBaseUrl}/api/session/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: slot.slug,
            userId: String(userId),
            balance,
          }),
        })
        if (!createRes.ok) {
          const err = await createRes.text()
          throw new Error(`Session API Error: ${err}`)
        }
        const data = await createRes.json() as { session_id: string }
    
        // 4) сохраняем в БД
        await this.prisma.slotSession.create({
          data: {
            userId,
            slotId: slot.id,
            sessionId: data.session_id,
          },
        })
        await this.logs.add('client', userId, `Открыл слот ${slot.name}`)
    
        // 5) читаем из game_settings
        const gs = await this.prisma.gameSetting.findFirst({
          where: { gameId: slot.id },
        })
        const minAdjust = gs?.minAdjustPercent ?? 0
        const maxAdjust = gs?.maxAdjustPercent ?? 0
    
        // 6) формируем JWT-пейлоад
        const tokenPayload = {
          sessionId: data.session_id,
          game: slot.slug,
          adjust: { min: minAdjust, max: maxAdjust },
        }
        const token = this.jwt.sign(tokenPayload)
    
        // 7) отдаём фронту ссылку с токеном
        return {
          link: `${slot.link}?token=${token}`,
        }
      }

    private async getOrCreateSession(symbol: string, userId: number) {
        let session = await this.prisma.slotSession.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        })
        if (!session) {
          // создаём новую
          const slot = await this.prisma.slot.findFirst({
            where: { slug: symbol, isActive: true },
            select: { id: true, slug: true },
          })
          if (!slot) throw new NotFoundException('Slot not found')
          await this.startSession(userId, slot.slug)
          session = await this.prisma.slotSession.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
          })
        }
        return session
      }

      async proxyGameRequest(userId: number, body: any): Promise<any> {
        // 1) пытаемся найти последнюю сессию
        let session = await this.prisma.slotSession.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
      
        // 2) если её нет — создаём
        if (!session) {
          const slotRecord = await this.prisma.slot.findFirst({
            where: { slug: body.symbol, isActive: true },
            select: { id: true, slug: true },
          });
          if (!slotRecord) {
            throw new NotFoundException('Slot not found for creating session');
          }
          await this.startSession(userId, slotRecord.slug);
          session = await this.prisma.slotSession.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
          });
          if (!session) {
            throw new Error('Failed to create game session');
          }
        }
      
        // 3) делаем запрос к провайдеру
        const providerRes = await fetch(
          `${this.externalBaseUrl}/api/slots/gs2c_/gameService`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, session_id: session.sessionId }),
          }
        );
      
        if (!providerRes.ok) {
          throw new Error(`Game API Error: ${await providerRes.text()}`);
        }
      
        const isJson =
          providerRes.headers.get('content-type')?.includes('application/json');
        const raw = isJson ? (await providerRes.json()) : await providerRes.text();
      
        // 4) если JSON и это «спин» — применяем подкрутку
        if (isJson && typeof raw === 'object' && ['doSpin', 'spin'].includes(body.command)) {
          const baseWin    = Number(raw.win);
          const betAmount  = Number(body.bet);
      
          const { adjustedWin, delta } = await this.gameLogic.processResult(
            userId,
            session.slotId,  // из slotSession
            baseWin,
            betAmount
          );
      
          raw.win   = adjustedWin;
          raw.delta = delta;    // можно вернуть фронту для отладки
        }
      
        // 5) возвращаем уже «подкрученный» ответ
        return raw;
      }
    
      async proxyStatsRequest(
        userId: number,
        qs: Record<string, string>,
        body: any,
      ): Promise<any> {
        const session = await this.getOrCreateSession(qs['symbol'], userId)
        qs['mgckey'] = `stylename@generic~SESSION@${session.sessionId}`
    
        const queryString = new URLSearchParams(qs).toString()
        const url = `${this.externalBaseUrl}/api/slots/gs2c/stats.do?${queryString}`
    
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body || {}),
        })
        if (!res.ok) {
          const err = await res.text()
          throw new Error(`Stats API Error: ${err}`)
        }
        const ct = res.headers.get('content-type')
        return ct?.includes('application/json') ? res.json() : res.text()
      }

      async proxyReloadBalanceRequest(
        userId: number,
        qs: Record<string, string>,
        // body: any,
      ): Promise<string> {
        const session = await this.getOrCreateSession(qs['symbol'], userId)
        qs['mgckey'] = `stylename@generic~SESSION@${session.sessionId}`
    
        const queryString = new URLSearchParams(qs).toString()
        const url = `${this.externalBaseUrl}/api/slots/gs2c/reloadBalance.do?${queryString}`;
        const res = await fetch(url, { method: 'GET' });
        const text = await res.text();
        console.log('ReloadBalance response (text):', text);
        
        if (!res.ok) throw new Error(await res.text());
        // вернём как текст, а не JSON
        return text;
    }

    async getAll(dto: GetAllSlotsDto): Promise<SlotListResponse> {
        const limit = 25
        const page = (dto.page - 1) * limit

        const where = dto.search
            ? {
                  OR: [
                      { name: { contains: dto.search } },
                      { slug: { contains: dto.search } }
                  ]
              }
            : {}

        const slots = await this.prisma.slot.findMany({
            where,
            skip: page,
            take: limit,
            select: {
                id: true,
                slug: true,
                name: true,
                link: true,
                image: {
                    select: {
                        fileName: true
                    }
                }
            }
        })

        const items = slots.map(slot => ({
            ...slot,
            image: slot.image?.fileName || null
        }))

        const count = await this.prisma.slot.count({ where })

        return {
            items,
            pages: Math.ceil(count / limit),
            count
        }
    }

    async getAllActive(dto: GetAllSlotsDto): Promise<SlotListResponse> {
        const limit = 25
        const page = (dto.page - 1) * limit

        const slots = await this.prisma.slot.findMany({
            where: { isActive: true },
            skip: page,
            take: limit,
            select: {
                id: true,
                slug: true,
                name: true,
                link: true,
                image: {
                    select: {
                        fileName: true
                    }
                }
            }
        })

        const items = slots.map(slot => ({
            ...slot,
            image: slot.image?.fileName || null
        }))

        const count = await this.prisma.slot.count({
            where: { isActive: true }
        })

        return {
            items,
            pages: Math.ceil(count / limit),
            count
        }
    }

    async editActive(slotId: number, isActive: boolean) {
        const slot = await this.prisma.slot.findFirst({
            where: { id: slotId }
        })

        if (!slot) {
            throw new NotFoundException('Слот не найден')
        }

        await this.prisma.slot.update({
            where: { id: slotId },
            data: { isActive }
        })

        return { message: 'Слот обновлен' }
    }

    async getBySlug(slug: string) {
        const slot = await this.prisma.slot.findFirst({
            where: { slug }
        })

        if (!slot) {
            throw new NotFoundException('Слот не найден')
        }

        return { slot }
    }

    async getLinkBySlug(slug: string, userId: number) {
        const slot = await this.prisma.slot.findFirst({
            where: { slug, isActive: true },
            select: { id: true, slug: true, name: true, link: true }
        })

        if (!slot) {
            throw new NotFoundException('Слот не найден')
        }

        const sessionData = await this.startSession(userId, slot.slug)

        return sessionData
    }

    async editById(id: number, dto: EditSlotDto) {
        const slot = await this.prisma.slot.findFirst({
            where: { id }
        })

        if (!slot) {
            throw new NotFoundException('Слот не найден')
        }

        if (dto.imageId) {
            const exists = await this.prisma.upload.count({
                where: { id: dto.imageId }
            })

            if (!exists) {
                throw new NotFoundException('Изображение не найдено')
            }
        }

        await this.prisma.slot.update({
            where: { id },
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                image: dto.imageId
                    ? {
                          connect: {
                              id: dto.imageId
                          }
                      }
                    : undefined
            }
        })

        return { message: 'Слот обновлен' }
    }

    async updateSession(dto: WebhookUpdateDto) {
        const session = await this.prisma.slotSession.findFirst({
            where: { sessionId: dto.sessionId },
            select: { id: true, userId: true }
        })

        if (!session) {
            throw new NotFoundException('Session not found')
        }

        await this.user.updateBalanceById(session.userId, dto.balance)
        // необязательно: this.events.updateUserBalance(session.userId, dto.balance)

        return { message: 'Session updated' }
    }
}
