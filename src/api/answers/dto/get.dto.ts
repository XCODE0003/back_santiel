import { IsNumber, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class GetAnswersDto {
    @Type(() => Number)
    @IsNumber(
        {
            allowNaN: false,
            allowInfinity: false
        },
        {
            message: 'Страница должна быть числом'
        }
    )
    @Min(1, {
        message: 'Страница не может быть меньше 1'
    })
    page: number = 1
}
