import { IsNumber, IsPositive } from 'class-validator'

export class GetLogsByIdDto {
    @IsNumber(
        {
            allowNaN: false
        },
        {
            message: 'ID должен быть числом'
        }
    )
    @IsPositive({
        message: 'ID должен быть положительным числом'
    })
    id: number

    @IsNumber(
        {
            allowNaN: false
        },
        {
            message: 'Номер страницы должен быть числом'
        }
    )
    @IsPositive({
        message: 'Номер страницы должен быть положительным числом'
    })
    page: number = 1
}
