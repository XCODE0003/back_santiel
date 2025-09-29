import { IsNumber, IsPositive } from 'class-validator'

export class EditPagesQueryDto {
    @IsNumber(
        {
            allowNaN: false,
            allowInfinity: false
        },
        {
            message: 'ID страницы должен быть числом'
        }
    )
    @IsPositive({
        message: 'ID страницы должен быть положительным числом'
    })
    id: number
}
