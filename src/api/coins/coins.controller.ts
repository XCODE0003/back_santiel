import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'

import { CoinsService } from './coins.service'

@Controller('coins')
export class CoinsController {
    constructor(private readonly coins: CoinsService) {}

    @Get()
    async getAll() {
        return this.coins.getAll()
    }

    @Post()
    async create(@Body() body: { name: string; symbol: string; icon: string; network: string }) {
        return this.coins.create(body)
    }

    @Put(':id')
    async update(
        @Param('id') id: number,
        @Body() body: { name?: string; symbol?: string; icon?: string; network?: string }
    ) {
        return this.coins.update(id, body)
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        return this.coins.delete(id)
    }
}

