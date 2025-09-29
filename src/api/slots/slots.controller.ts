import { Body, Controller, Get, Header, HttpCode, Param, Post, Put, Query, Res } from '@nestjs/common'
import { FormDataRequest } from 'nestjs-form-data'

import { EditSlotDto } from '@/api/slots/dto/edit.dto'
import { GetAllSlotsDto } from '@/api/slots/dto/get-all.dto'
import { WebhookUpdateDto } from '@/api/slots/dto/webhook-update.dto'
import { SlotListResponse } from '@/api/slots/slots.types'
import { ROLES } from '@/api/user/user.constants'
import { Auth, CurrentUser } from '@/common/decorators'

import { SlotsService } from './slots.service'
import { ApiOperation, ApiBody, ApiTags } from '@nestjs/swagger'
import { Public } from '@/common/decorators/public.decorator'

@ApiTags('Slots')
@Controller('slots')
export class SlotsController {
    constructor(private readonly slotsService: SlotsService) {}

    @Auth(ROLES.CLIENT, ROLES.WORKER, ROLES.ADMIN)
    @Get()
    async getSlots(
        @CurrentUser('role') role: ROLES,
        @Query() dto: GetAllSlotsDto
    ): Promise<SlotListResponse> {
        if (role === ROLES.CLIENT) {
            return await this.slotsService.getAllActive(dto)
        }

        return await this.slotsService.getAll(dto)
    }

    @ApiOperation({ summary: 'Проксирование игровых команд (doInit, doSpin и др.)' })
    @ApiBody({
    schema: {
        type: 'object',
        properties: {
        command: { type: 'string', example: 'doSpin' },
        bet: { type: 'number', example: 100 },
        lines: { type: 'number', example: 10 },
        extraData: {
            type: 'object',
            example: { someKey: 'someValue' }
        }
        }
    }
    })
    @Public()
    @Post('gs2c_/gameService')
    async proxyGameRequest(
        @Body() body: any,
        @Res() res
    ): Promise<any> {
        const userId = 1 // временно
        const result = await this.slotsService.proxyGameRequest(userId, body)
        if (typeof result === 'object') {
            return res.json(result);
        } else {
            res.type('text/plain').send(result);
        }
    }

    @Public()
    @Post('link/:slug')
    async getSessionLink(
        @Param('slug') slug: string
    ): Promise<{ link: string }> {
        const userId = 1 // временно, потом заменишь на @CurrentUser('id')
        return await this.slotsService.getLinkBySlug(slug, userId)
    }

    @Public()
    @Post('gs2c/stats.do')
    async proxyStats(
        @Query() qs: Record<string, string>,
        @Body() body: any
    ) {
        const userId = 1
        return this.slotsService.proxyStatsRequest(userId, qs, body)
    }

    /** (опционально) saveSettings.do */
    @Public()
    @Post('gs2c/saveSettings.do')
    async proxySaveSettings(
        @Query() qs: Record<string, string>,
        @Body() body: any
    ) {
        const userId = 1
        return this.slotsService.proxyStatsRequest(userId, qs, body)
    }

    @Public()
    @Get('gs2c/reloadBalance.do')
    async proxyReloadBalance(
        @Query() qs: Record<string, string>,
    ): Promise<string> {
        const userId = 1
        const text = await this.slotsService.proxyReloadBalanceRequest(userId, qs)
        // т.к. мы поставили @Header, Nest отдаст именно эту строку без обёртки в JSON
        return text
    }

    @Auth(ROLES.ADMIN)
    @Put(':slotId/active')
    editSlotActive(
        @Param('slotId') slotId: number,
        @Body('isActive') isActive: boolean
    ): any {
        return this.slotsService.editActive(slotId, isActive)
    }

    @Auth(ROLES.CLIENT, ROLES.WORKER, ROLES.ADMIN)
    @Get(':slug')
    getSlotBySlug(
        @Param('slug') slug: string,
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: ROLES
    ): any {
        if (role === ROLES.ADMIN) {
            return this.slotsService.getBySlug(slug)
        }

        return this.slotsService.getLinkBySlug(slug, userId)
    }

    @Auth(ROLES.ADMIN)
    @Put(':id')
    editSlot(@Param('id') id: number, @Body() dto: EditSlotDto): any {
        return this.slotsService.editById(id, dto)
    }

    @Post(':slug/webhook/update')
    @FormDataRequest()
    async getWebhookBySlug(@Body() dto: WebhookUpdateDto): Promise<any> {
        return await this.slotsService.updateSession(dto)
    }
}
