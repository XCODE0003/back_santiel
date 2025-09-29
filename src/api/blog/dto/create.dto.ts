import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
    MinLength
} from 'class-validator'

export class EditArticleParamsDto {
    @IsNumber(
        {
            allowNaN: false,
            allowInfinity: false
        },
        {
            message: 'ID статьи должен быть числом'
        }
    )
    @IsPositive({
        message: 'ID статьи должен быть больше 0'
    })
    articleId: number
}

export class CreateArticleDto {
    @IsString({
        message: 'Заголовок должен быть строкой'
    })
    @IsNotEmpty({
        message: 'Заголовок обязателен'
    })
    @MinLength(3, {
        message: 'Заголовок должен содержать минимум 3 символа'
    })
    @MaxLength(255, {
        message: 'Заголовок должен содержать максимум 255 символов'
    })
    title: string

    @IsString({
        message: 'Ссылка должна быть строкой'
    })
    @IsNotEmpty({
        message: 'Ссылка обязательна'
    })
    @MinLength(3, {
        message: 'Ссылка должна содержать минимум 3 символа'
    })
    @MaxLength(255, {
        message: 'Ссылка должна содержать максимум 255 символов'
    })
    path: string

    @IsString({
        message: 'Контент должен быть строкой'
    })
    @IsNotEmpty({
        message: 'Контент обязателен'
    })
    @MinLength(3, {
        message: 'Контент должен содержать минимум 3 символа'
    })
    @MaxLength(10000, {
        message: 'Контент должен содержать максимум 10000 символов'
    })
    content: string

    @IsOptional()
    @IsNumber(
        {
            allowNaN: false,
            allowInfinity: false
        },
        {
            message: 'Баннер должен быть числом'
        }
    )
    @IsPositive({
        message: 'Баннер должен быть больше 0'
    })
    imageId: number
}
