import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Put,
    Query
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { DismissStaffDto } from '@/api/user/dto/dismiss-staff.dto'
import { GetAllUsersDto } from '@/api/user/dto/get-all'
import { GetUserAuthorizationsDto } from '@/api/user/dto/get-authorizations.dto'
import { GetByEmailDto } from '@/api/user/dto/get-by-email.dto'
import { GetSettingsDto } from '@/api/user/dto/get-settings.dto'
import {
    UpdateSettingsDto,
    UpdateSettingsParamsDto
} from '@/api/user/dto/update-settings.dto'
import { Auth, CurrentUser } from '@/common/decorators'

import { ROLES } from './user.constants'
import { UserService } from './user.service'

@ApiTags('users')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Auth()
    @Get('profile')
    async getProfile(@CurrentUser('id') id: number) {
        return await this.userService.getById(id)
    }

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Get('all')
    @HttpCode(200)
    async getAll(
        @CurrentUser('role') role: ROLES,
        @CurrentUser('id') userId: number,
        @Query() dto: GetAllUsersDto
    ) {
        if (role === ROLES.WORKER) {
            return this.userService.getAll(dto, userId)
        }

        return this.userService.getAll(dto)
    }

    @Auth(ROLES.ADMIN)
    @Get('staff')
    async getStaff(@Query() dto: GetAllUsersDto) {
        return this.userService.getStaff(dto)
    }

    @Auth(ROLES.ADMIN)
    @Put('staff/dismiss/:id')
    async dismissStaff(@Param() dto: DismissStaffDto) {
        return this.userService.dismissStaff(dto)
    }

    //TODO: Добавить привязку на worker_id
    @Auth(ROLES.ADMIN, ROLES.WORKER)
    @Get(':email')
    async getById(@Param() queryDto: GetByEmailDto) {
        return this.userService.getByEmail(queryDto.email)
    }

    //TODO: Добавить привязку на worker_id
    @Auth(ROLES.ADMIN, ROLES.WORKER)
    @Get('authorizations/:id')
    async getAuthorizations(@Param() dto: GetUserAuthorizationsDto) {
        const items = await this.userService.getAuthorizations(dto.id, dto.page)

        return {
            items,
            count: items.length
        }
    }

    //TODO: Добавить привязку на worker_id
    @Auth(ROLES.ADMIN, ROLES.WORKER)
    @Get('settings/:userId')
    async getSettings(@Param() queryDto: GetSettingsDto) {
        return {
            items: await this.userService.getSettings(queryDto.userId)
        }
    }

    //TODO: Добавить привязку на worker_id
    @Auth(ROLES.ADMIN, ROLES.WORKER)
    @Put('settings/:userId')
    async updateSettings(
        @Param() paramsDto: UpdateSettingsParamsDto,
        @Body() dto: UpdateSettingsDto
    ) {
        await this.userService.updateSetting(paramsDto.userId, dto)

        return {
            message: 'Настройки успешно обновлены'
        }
    }
}
