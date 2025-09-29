import { Injectable, OnModuleInit } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { PrismaService } from '@/infra/prisma/prisma.service'
import { formatPath } from '@/libs/formatPath'

@Injectable()
export class CoinsService implements OnModuleInit {
    constructor(private readonly prisma: PrismaService) {}

    async getAll() {
        const coins = await this.prisma.coin
            .findMany({
                orderBy: {
                    id: 'asc'
                }
            })
            .then(res =>
                res.map(coin => ({
                    ...coin,
                    icon: formatPath(coin.icon, 'coins')
                }))
            )

        return {
            coins: coins
        }
    }

    async onModuleInit() {
        try {
            await this.parse()
        } catch (err) {
            console.error('🚨 Failed to parse coin prices on startup:', err.message)
        }
    }

    @Cron(CronExpression.EVERY_MINUTE)
    async parse() {
        const coins = await this.prisma.coin.findMany({
            select: { id: true, symbol: true }
        })

        const coinIds = coins.map(c => c.id)
        const symbols = coins.map(c => `${c.symbol.toUpperCase()}USDT`)

        try {
            const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`

            const response = await fetch(url)
            const res = await response.json()

            if (!Array.isArray(res)) {
                console.error('🚨 Binance returned non-array response:', res)
                return
            }

            const data = res.map((item: any) => ({
                id: coinIds[symbols.indexOf(item.symbol)],
                price: parseFloat(item.lastPrice)
            }))

            await Promise.all(
            data.map(async ({ id, price }) => {
                if (!id || isNaN(price)) return
                    await this.prisma.coin.update({
                        where: { id },
                        data: { price }
                    })
                })
            )
        } catch (error) {
            console.error('❌ Error fetching Binance data:', error)
        }
    }

    async create(data: { name: string; symbol: string; icon: string; network: string }) {
        return this.prisma.coin.create({
            data: {
                name: data.name,
                symbol: data.symbol,
                icon: data.icon,
                //network: data.network,
                price: 0 // по умолчанию 0, потом обновит parse()
            }
        })
    }

    async update(id: number, data: { name?: string; symbol?: string; icon?: string; network?: string }) {
        return this.prisma.coin.update({
            where: { id },
            data: {
                name: data.name,
                symbol: data.symbol,
                icon: data.icon
                //network: data.network
            }
        })
    }

    async delete(id: number) {
        return this.prisma.coin.delete({
            where: { id }
        })
    }
}
