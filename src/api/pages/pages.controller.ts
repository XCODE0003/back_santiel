import {
    Body,
    Controller, Delete,
    Get,
    HttpCode,
    Param,
    Post,
    Put
} from '@nestjs/common'

import { CreatePageDto } from '@/api/pages/dto/create.dto'
import { EditPagesQueryDto } from '@/api/pages/dto/edit.dto'
import { ROLES } from '@/api/user/user.constants'
import { Auth } from '@/common/decorators'

import { PagesService } from './pages.service'

@Controller('pages')
export class PagesController {
    constructor(private readonly pagesService: PagesService) {}

    @Auth(ROLES.ADMIN)
    @Post()
    @HttpCode(200)
    async createPage(@Body() dto: CreatePageDto) {
        await this.pagesService.create(dto)

        return {
            message: 'Страница успешно создана'
        }
    }

    @Auth()
    @Get()
    async getPages() {
        const pages = await this.pagesService.getAll()

        return {
            items: pages
        }
    }

    @Auth(ROLES.ADMIN)
    @Put(':id')
    @HttpCode(200)
    async editPage(
        @Param() queryDto: EditPagesQueryDto,
        @Body() dto: CreatePageDto
    ) {
        await this.pagesService.edit(queryDto, dto)

        return {
            message: 'Страница успешно изменена'
        }
    }

    @Auth(ROLES.ADMIN)
    @Delete(':id')
    @HttpCode(200)
    async delete(@Param() queryDto: EditPagesQueryDto) {
        await this.pagesService.delete(queryDto)

        return {
            message: 'Страница успешно удалена'
        }
    }
}
