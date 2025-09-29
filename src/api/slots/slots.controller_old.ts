import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { FormDataRequest } from 'nestjs-form-data'

import { EditSlotDto } from '@/api/slots/dto/edit.dto'
import { GetAllSlotsDto } from '@/api/slots/dto/get-all.dto'
import { WebhookUpdateDto } from '@/api/slots/dto/webhook-update.dto'
import { ROLES } from '@/api/user/user.constants'
import { Auth, CurrentUser } from '@/common/decorators'

import { SlotsService } from './slots.service_old'

@Controller('slots')
export class SlotsController {
    constructor(private readonly slotsService: SlotsService) {}

    @Auth(ROLES.CLIENT, ROLES.WORKER, ROLES.ADMIN)
    @Get()
    async getSlots(
        @CurrentUser('role') role: ROLES,
        @Query() dto: GetAllSlotsDto
    ) {
        if (role === ROLES.CLIENT) {
            return this.slotsService.getAllActive(dto)
        }

        return this.slotsService.getAll(dto)
    }

    @Auth(ROLES.ADMIN)
    @Put(':slotId/active')
    async editSlotActive(
        @Param('slotId') slotId: number,
        @Body('isActive') isActive: boolean
    ) {
        return this.slotsService.editActive(slotId, isActive)
    }

    @Auth(ROLES.CLIENT, ROLES.WORKER, ROLES.ADMIN)
    @Get(':slug')
    async getSlotBySlug(
        @Param('slug') slug: string,
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: ROLES
    ) {
        if (role === ROLES.ADMIN) {
            return this.slotsService.getBySlug(slug)
        }

        return this.slotsService.getLinkBySlug(slug, userId)
    }

    @Auth(ROLES.ADMIN)
    @Put(':id')
    async editSlot(@Param('id') id: number, @Body() dto: EditSlotDto) {
        return this.slotsService.editById(id, dto)
    }

    @Post(':slug/webhook/update')
    @FormDataRequest()
    async getWebhookBySlug(@Body() dto: WebhookUpdateDto) {
        return await this.slotsService.updateSession(dto)
    }
}
