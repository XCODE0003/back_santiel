import {
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Matches
} from 'class-validator'

export class AddDomainDto {
    @IsString()
    @IsNotEmpty({
        message: 'Вы не указали домен'
    })
    @Matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
        message: 'Вы указали некорректный домен. Пример: example.com'
    })
    domain: string

    @IsNumber()
    @IsPositive()
    accountId: number

    @IsOptional()
    @IsEmail()
    email?: string
}
