import { Body, Controller, Get, Param, Put } from '@nestjs/common'

import { EditConfigDto, EditConfigParamsDto } from '@/api/configs/dto/edit.dto'
import { ROLES } from '@/api/user/user.constants'
import { Auth } from '@/common/decorators'

import { ConfigsService } from './configs.service'

@Controller('configs')
export class ConfigsController {
    constructor(private readonly configsService: ConfigsService) {}

    @Auth(ROLES.ADMIN)
    @Get()
    async getConfigs() {
        return this.configsService.getAll()
    }

    @Auth(ROLES.ADMIN)
    @Put(':configId')
    async editConfig(
        @Param('configId') paramsDto: EditConfigParamsDto,
        @Body() dto: EditConfigDto
    ) {
        return this.configsService.edit(paramsDto.configId, dto)
    }
}
