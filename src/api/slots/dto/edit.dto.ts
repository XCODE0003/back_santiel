import {
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
    MinLength
} from 'class-validator'

export class EditSlotDto {
    @IsNumber(
        {
            allowInfinity: false,
            allowNaN: false
        },
        {
            message: 'Вы указали неверный id слота'
        }
    )
    @IsPositive({
        message: 'Id слота должен быть положительным'
    })
    publicId: number

    @IsString({
        message: 'Название слота должно быть строкой'
    })
    @MinLength(3, {
        message: 'Название слота должно быть больше 3 символов'
    })
    @MaxLength(64, {
        message: 'Название слота должно быть меньше 64 символов'
    })
    name: string

    @IsString()
    @MinLength(3, {
        message: 'Slug должен быть больше 3 символов'
    })
    @MaxLength(64, {
        message: 'Slug должен быть меньше 64 символов'
    })
    slug: string

    @IsString({
        message: 'Описание слота должно быть строкой'
    })
    @IsOptional()
    @MinLength(3, {
        message: 'Описание слота должно быть больше 3 символов'
    })
    @MaxLength(1024, {
        message: 'Описание слота должно быть меньше 1024 символов'
    })
    description: string

    @IsNumber(
        {
            allowInfinity: false,
            allowNaN: false
        },
        {
            message: 'Вы указали неверный id изображения'
        }
    )
    @IsPositive({
        message: 'Id изображения должен быть положительным'
    })
    @IsOptional({
        message: 'Id изображения должен быть положительным'
    })
    imageId: number
}
