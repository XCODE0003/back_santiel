import { IsNumber, IsPositive } from 'class-validator'

import { CreateAnswerDto } from '@/api/answers/dto/create.dto'

export class EditAnswerParamsDto {
    @IsNumber(
        {
            allowNaN: false,
            allowInfinity: false
        },
        {
            message: 'ID должен быть числом'
        }
    )
    @IsPositive({
        message: 'ID должен быть положительным числом'
    })
    id: number
}

export class EditAnswerDto extends CreateAnswerDto {
    @IsNumber(
        {
            allowNaN: false,
            allowInfinity: false
        },
        {
            message: 'ID должен быть числом'
        }
    )
    @IsPositive({
        message: 'ID должен быть положительным числом'
    })
    id: number
}
