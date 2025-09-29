import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, ValidateIf } from 'class-validator'

export class UpdateSettingsParamsDto {
    @IsInt({
        message: 'Неверное значение для поля {{ property }}'
    })
    @IsNotEmpty({
        message: 'Поле {{ property }} не может быть пустым'
    })
    @IsPositive({
        message: 'Неверное значение для поля {{ property }}'
    })
    userId: number
}

export class UpdateSettingsDto {
    @IsString({
        message: 'Неверное значение для поля {{ property }}'
    })
    @IsNotEmpty({
        message: 'Поле {{ property }} не может быть пустым'
    })
    key: 'email' | 'password' | 'balance' | 'role'

    @ValidateIf((o) => o.key === 'balance' || o.key === 'role')
    @IsNumber({}, { message: 'Значение должно быть числом' })
    @ValidateIf((o) => o.key === 'email' || o.key === 'password')
    @IsString({ message: 'Значение должно быть строкой' })
    value: any
}
