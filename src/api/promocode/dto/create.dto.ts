import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength
} from 'class-validator'

export class CreatePromocodeDto {
    @IsString({
        message: 'Промокод должен быть строкой'
    })
    @IsNotEmpty({
        message: 'Промокод не должен быть пустым'
    })
    @MinLength(3, {
        message:
            'Промокод слишком короткий. Минимальная длина - $constraint1 символа'
    })
    @MaxLength(32, {
        message:
            'Промокод слишком длинный. Максимальная длина - $constraint1 символов'
    })
    @Matches(/^[A-Za-z0-9]+$/, {
        message: 'Промокод должен содержать только буквы и цифры'
    })
    code: string

    @IsNumber()
    @IsNotEmpty({
        message: 'Сумма не должна быть пустой'
    })
    amount: number

    @IsString()
    @IsOptional()
    @MinLength(6, {
        message:
            'Сообщение слишком короткое. Минимальная длина - $constraint1 символа'
    })
    @MaxLength(128, {
        message:
            'Сообщение слишком длинное. Максимальная длина - $constraint1 символов'
    })
    message: string

    @IsBoolean({
        message: 'Некорректное значение для подкрутки'
    })
    isLucky: boolean = false
}
