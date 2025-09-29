import { Controller, Delete, Get, Param, Query } from '@nestjs/common'

import { DeleteSeedDto } from '@/api/seeds/dto/delete.dto'
import { GetAllSeedsDto } from '@/api/seeds/dto/get-all.dto'
import { ROLES } from '@/api/user/user.constants'
import { Auth } from '@/common/decorators'

import { SeedsService } from './seeds.service'

@Controller('seeds')
export class SeedsController {
    constructor(private readonly seeds: SeedsService) {}

    @Auth(ROLES.ADMIN)
    @Get()
    async getAll(@Query() dto: GetAllSeedsDto) {
        return this.seeds.getAll(dto)
    }

    @Auth(ROLES.ADMIN)
    @Delete(':id')
    delete(@Param() dto: DeleteSeedDto) {
        return this.seeds.remove(dto)
    }
}
