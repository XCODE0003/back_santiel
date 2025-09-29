import {
    Body,
    Controller,
    Get,
    HttpCode,
    Param,
    Post,
    Put,
    Query
} from '@nestjs/common'

import { BlogService } from '@/api'
import {
    CreateArticleDto,
    EditArticleParamsDto
} from '@/api/blog/dto/create.dto'
import { GetAllAriclesDto } from '@/api/blog/dto/get-all.dto'
import { GetArticleByPathDto } from '@/api/blog/dto/get-by-path.dto'
import { ROLES } from '@/api/user/user.constants'
import { Auth } from '@/common/decorators'

@Controller('blog')
export class BlogController {
    constructor(private readonly blogService: BlogService) {}

    @Get()
    @HttpCode(200)
    async getArticles(@Query() dto: GetAllAriclesDto) {
        return this.blogService.getAllArticles(dto)
    }

    @Get(':path')
    async getArticleByPath(@Param('path') dto: GetArticleByPathDto) {
        return this.blogService.getArticleByPath(dto.path)
    }

    @Auth(ROLES.ADMIN)
    @Put(':articleId')
    async updateArticle(
        @Param('articleId') paramsDto: EditArticleParamsDto,
        @Body() dto: CreateArticleDto
    ) {
        return this.blogService.updateArticle(paramsDto.articleId, dto)
    }

    @Auth(ROLES.ADMIN)
    @Post('create')
    async createArticle(@Body() dto: CreateArticleDto) {
        return this.blogService.createArticle(dto)
    }
}
