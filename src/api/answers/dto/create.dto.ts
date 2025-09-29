import {
    IsNumber,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength
} from 'class-validator'

export class CreateAnswerDto {
    @IsString({
        message: 'Название не должно быть пустым'
    })
    @MinLength(1, {
        message: 'Название не должно быть пустым'
    })
    @MaxLength(255, {
        message: 'Название не должно превышать 255 символов'
    })
    name: string

    @IsString({
        message: 'Текст не должен быть пустым'
    })
    @MinLength(1, {
        message: 'Текст не должен быть пустым'
    })
    @MaxLength(3000, {
        message: 'Текст не должен превышать 3000 символов'
    })
    text: string

    @IsNumber(
        {
            allowNaN: false,
            allowInfinity: false
        },
        {
            message: 'Приоритет должен быть числом'
        }
    )
    @Min(0, {
        message: 'Приоритет не может быть меньше 0'
    })
    @Max(1000, {
        message: 'Приоритет не должен превышать 1000'
    })
    priority: number = 0
}
