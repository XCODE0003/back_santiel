import { IsNumber, IsPositive } from 'class-validator'

export class GetAllSeedsDto {
    @IsNumber(
        {
            allowNaN: false,
            allowInfinity: false
        },
        {
            message: 'Страница должна быть числом'
        }
    )
    @IsPositive({
        message: 'Страница должна быть положительным числом'
    })
    page: number
}
