import { IsNumber, IsOptional, IsPositive } from 'class-validator'

export class GetDomainsDto {
    @IsNumber(
        {
            allowNaN: false,
            allowInfinity: false,
            maxDecimalPlaces: 0
        },
        {
            message: 'Некорректная страница'
        }
    )
    @IsPositive({
        message: 'Страница должна быть больше 0'
    })
    page: number = 1

    @IsOptional()
    search?: string
}
