import {Body, Controller, Delete, Get, Param, Post, Put, Query} from '@nestjs/common'

import { CreateAnswerDto } from '@/api/answers/dto/create.dto'
import { DeleteAnswerDto } from '@/api/answers/dto/delete.dto'
import { EditAnswerDto, EditAnswerParamsDto } from '@/api/answers/dto/edit.dto'
import { GetAnswersDto } from '@/api/answers/dto/get.dto'
import { ROLES } from '@/api/user/user.constants'
import { Auth } from '@/common/decorators'

import { AnswersService } from './answers.service'

@Controller('answers')
export class AnswersController {
    constructor(private readonly answersService: AnswersService) {}

    @Auth(ROLES.ADMIN)
    @Post('create')
    async create(@Body() dto: CreateAnswerDto) {
        return this.answersService.create(dto)
    }

    @Auth(ROLES.ADMIN)
    @Get()
    async getAll(@Query() dto: GetAnswersDto) {
        return this.answersService.getAll(dto)
    }

    @Auth(ROLES.ADMIN)
    @Put(':id')
    async update(
        @Param('id') paramsDto: EditAnswerParamsDto,
        @Body() dto: EditAnswerDto
    ) {
        dto.id = paramsDto.id

        return this.answersService.update(dto)
    }

    @Auth(ROLES.ADMIN)
    @Delete(':id')
    async delete(@Param() dto: DeleteAnswerDto) {
        return this.answersService.deleteById(dto)
    }
}
