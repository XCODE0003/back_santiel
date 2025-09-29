import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common'

import { GetByIdDto } from '@/api/settings/dto/get-by-id.dto'
import {
    UpdateSettingDto,
    UpdateSettingParamsDto
} from '@/api/settings/dto/update.dto'
import {
    UpdateSettingById,
    UpdateSettingByIdParams
} from '@/api/settings/update-by-id.dto'
import { ROLES } from '@/api/user/user.constants'
import { Auth, CurrentUser } from '@/common/decorators'

import { SettingsService } from './settings.service'

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Get()
    async getSettings(
        @CurrentUser('role') role: number,
        @CurrentUser('id') userId: number
    ) {
        if (role === ROLES.WORKER) {
            const settings = await this.settingsService.getUserSettings(userId)

            return {
                items: settings
            }
        }

        const settings = await this.settingsService.getSettings()

        return {
            items: settings
        }
    }

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Put(':id')
    async updateSetting(
        @Param() params: UpdateSettingParamsDto,
        @Body() dto: UpdateSettingDto,
        @CurrentUser('role') role: number,
        @CurrentUser('id') userId: number
    ) {
        if (role === ROLES.WORKER) {
            await this.settingsService.updateUserSetting(
                userId,
                params.id,
                dto.value
            )
        } else {
            await this.settingsService.updateSetting(params.id, dto)
        }

        return {
            success: true,
            message: 'Настройка обновлена'
        }
    }

    @Auth(ROLES.ADMIN, ROLES.WORKER)
    @Get(':id')
    async getSetting(@Param() queryDto: GetByIdDto) {
        const items = await this.settingsService.getUserSettings(queryDto.id)

        return {
            items
        }
    }

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Put('user/:id')
    async updateUserSetting(
        @Param() params: UpdateSettingByIdParams,
        @Body() dto: UpdateSettingById
    ) {
        await this.settingsService.updateUserSetting(
            params.id,
            dto.id,
            dto.value
        )

        return {
            success: true,
            message: 'Настройка пользователя обновлена'
        }
    }
}
