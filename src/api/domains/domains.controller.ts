import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'

import { DomainsService } from '@/api/domains/domains.service'
import { AddDomainDto } from '@/api/domains/dto/add.dto'
import { EditDomainDto, EditDomainParamsDto } from '@/api/domains/dto/edit.dto'
import { GetDomainsDto } from '@/api/domains/dto/get.dto'
import { ROLES } from '@/api/user/user.constants'
import { Auth } from '@/common/decorators'

@Controller('domains')
export class DomainsController {
    constructor(private readonly errorsService: DomainsService) {}

    @Auth(ROLES.ADMIN)
    @Put(':id/edit')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: EditDomainDto
    ) {
        return this.errorsService.update(id, dto)
    }

    @Auth(ROLES.ADMIN)
    @Get()
    async getAll(@Query() dto: GetDomainsDto) {
        return this.errorsService.getAll(dto)
    }

    @Auth(ROLES.ADMIN)
    @Post('add')
    async create(@Body() dto: AddDomainDto) {
        return this.errorsService.add(dto)
    }

    @Auth(ROLES.ADMIN)
    @Get('check')
    async check(@Query('domain') domain: string) {
        const exists = await this.errorsService.isExist(domain)
        return { found: exists }
    }

    @Auth(ROLES.ADMIN)
    @Delete(':id/delete')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.errorsService.delete(id)
    }

    @Post(':id/ensure-zone')
    @Auth(ROLES.ADMIN)
    async ensureZone(@Param('id', ParseIntPipe) id: number) {
        return this.errorsService.ensureZone(id)
    }
}
