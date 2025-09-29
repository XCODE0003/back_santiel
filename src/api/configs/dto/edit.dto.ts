import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength
} from 'class-validator'

export class EditConfigParamsDto {
    @IsInt({
        message: 'ID конфигурации должен быть числом'
    })
    configId: number
}

export class EditConfigDto {
    @IsOptional()
    @IsString({
        message: 'Поле должно быть строкой'
    })
    @IsNotEmpty({
        message: 'Поле не должно быть пустым'
    })
    @MinLength(1, {
        message: 'Поле не должно быть пустым'
    })
    @MaxLength(255, {
        message: 'Поле не должно превышать 255 символов'
    })
    value: string
}
