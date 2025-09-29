import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common'

import { CreateArticleDto } from '@/api/blog/dto/create.dto'
import { GetAllAriclesDto } from '@/api/blog/dto/get-all.dto'
import { UploadService } from '@/api/upload/upload.service'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { formatPath } from '@/libs/formatPath'

@Injectable()
export class BlogService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly upload: UploadService
    ) {}

    async getAllArticles(dto: GetAllAriclesDto) {
        const limit = 25
        const page = (dto.page - 1) * limit

        let articles, pages: number

        if (!dto.search) {
            articles = await this.prisma.blog.findMany({
                skip: page,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    title: true,
                    path: true,
                    content: true,
                    createdAt: true,

                    banner: {
                        select: {
                            fileName: true
                        }
                    }
                }
            })
            pages = await this.prisma.blog.count()
        } else {
            articles = await this.prisma.blog.findMany({
                where: {
                    title: {
                        contains: dto.search
                    },
                    content: {
                        contains: dto.search
                    }
                },
                select: {
                    title: true,
                    path: true,
                    content: true,
                    createdAt: true,

                    banner: {
                        select: {
                            fileName: true
                        }
                    }
                },
                skip: page,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            })
            pages = await this.prisma.blog.count({
                where: {
                    title: {
                        contains: dto.search
                    },
                    content: {
                        contains: dto.search
                    }
                }
            })
        }

        articles = articles.map(article => {
            return {
                ...article,
                banner: article.banner
                    ? formatPath(article.banner.fileName)
                    : null
            }
        })

        return {
            articles,
            pages: Math.ceil(pages / limit)
        }
    }

    async getArticleByPath(path: string) {
        if (!path) {
            throw new BadRequestException('Path is required')
        }

        const article = await this.prisma.blog.findUnique({
            where: {
                path
            },
            select: {
                id: true,
                title: true,
                content: true,
                path: true,
                createdAt: true,
                banner: {
                    select: {
                        fileName: true
                    }
                }
            }
        })

        return {
            article: {
                ...article,
                banner: formatPath(article.banner.fileName)
            }
        }
    }

    async createArticle(dto: CreateArticleDto) {
        const findArticle = await this.prisma.blog.count({
            where: {
                path: dto.path
            }
        })

        if (findArticle) {
            throw new BadRequestException('Path already exists')
        }

        const isExists = await this.upload.getById(dto.imageId)

        if (!isExists) {
            throw new NotFoundException('Image not found')
        }

        await this.prisma.blog.create({
            data: {
                title: dto.title,
                path: dto.path,
                content: dto.content,
                banner: {
                    connect: {
                        id: dto.imageId
                    }
                }
            }
        })

        return {
            message: 'Статья успешно создана'
        }
    }

    async updateArticle(articleId: number, dto: CreateArticleDto) {
        /*
        const findArticle = await this.prisma.blog.count({
            where: {
                path: dto.path,
                NOT: {
                    id: articleId
                }
            }
        })

        if (findArticle) {
            throw new BadRequestException('Path already exists')
        }

        const isExists = await this.upload.getById(dto.imageId)

        if (!isExists) {
            throw new NotFoundException('Image not found')
        }
         */

        if (dto.imageId) {
            await this.prisma.blog.update({
                where: {
                    id: articleId
                },
                data: {
                    title: dto.title,
                    content: dto.content,
                    path: dto.path,
                    banner: {
                        connect: {
                            id: dto.imageId
                        }
                    }
                }
            })
        } else {
            await this.prisma.blog.update({
                where: {
                    id: articleId
                },
                data: {
                    title: dto.title,
                    content: dto.content,
                    path: dto.path
                }
            })
        }

        return {
            message: 'Статья успешно обновлена'
        }
    }
}
