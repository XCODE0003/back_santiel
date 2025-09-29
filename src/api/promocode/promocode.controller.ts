import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query
} from '@nestjs/common'

import { EditPromocodeDto } from '@/api/promocode/dto/edit.dto'
import { GetAllPromocodesDto } from '@/api/promocode/dto/get-all.dto'
import { Auth, CurrentUser } from '@/common/decorators'

import { ROLES } from '../user/user.constants'

import { CreatePromocodeDto } from './dto/create.dto'
import { PromocodeService } from './promocode.service'

@Controller('promocodes')
export class PromocodeController {
    constructor(private readonly promocodeService: PromocodeService) {}

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Get()
    async getAll(
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: ROLES,
        @Query() dto: GetAllPromocodesDto
    ) {
        if (role === ROLES.WORKER) {
            return this.promocodeService.getWorkerPromocodes(userId, dto)
        }

        return this.promocodeService.getAll(dto)
    }

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Post('create')
    async create(
        @Body() dto: CreatePromocodeDto,
        @CurrentUser('id') userId: number
    ) {
        return this.promocodeService.create(userId, dto)
    }

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Put(':id')
    async edit(
        @Param('id') id: number,
        @Body() dto: EditPromocodeDto,
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: ROLES
    ) {
        if (role === ROLES.WORKER) {
            const isOwner = await this.promocodeService.isUserOwner(id, userId)

            if (!isOwner) {
                throw new Error('You are not the owner of this promocode')
            }
        }

        dto['id'] = id

        return this.promocodeService.edit(dto)
    }

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Delete(':id')
    async delete(
        @Param('id') id: number,
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: ROLES
    ) {
        if (role === ROLES.WORKER) {
            const isOwner = await this.promocodeService.isUserOwner(id, userId)

            if (!isOwner) {
                throw new Error('You are not the owner of this promocode')
            }
        }

        return this.promocodeService.delete(id)
    }
}
