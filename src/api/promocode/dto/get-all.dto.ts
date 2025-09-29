import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator'

export class GetAllPromocodesDto {
    @IsNumber(
        {
            allowInfinity: false,
            allowNaN: false
        },
        {
            message: 'Вы указали неверный номер страницы'
        }
    )
    @IsPositive({
        message: 'Номер страницы должен быть положительным'
    })
    page: number

    @IsString({
        message: 'Вы указали неверный поисковой запрос'
    })
    @IsOptional({
        message: 'Поисковой запрос должен быть строкой'
    })
    search: string
}
