import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator'

export class EditErrorDto {
    @IsString({
        message: 'Значение ошибки должна быть строкой'
    })
    @IsNotEmpty({
        message: 'Значение ошибки не может быть пустым'
    })
    @MinLength(1, {
        message: 'Значение ошибки не может быть пустым'
    })
    @MaxLength(1000, {
        message: 'Значение ошибки не может превышать 1000 символов'
    })
    value: string
}
