import {
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsString,
    Matches
} from 'class-validator'

export class EditDomainParamsDto {
    @IsNumber(
        {},
        {
            message: 'Некорректный id'
        }
    )
    @IsPositive({
        message: 'id должен быть больше 0'
    })
    id: number
}

export class EditDomainDto {
    @IsString()
    @IsNotEmpty({ message: 'Вы не указали домен' })
    @Matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
        message: 'Вы указали некорректный домен. Пример: example.com'
    })
    domain: string

    ns1?: string
    ns2?: string
}