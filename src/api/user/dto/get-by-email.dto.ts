import { IsEmail } from 'class-validator'

export class GetByEmailDto {
    @IsEmail(
        {
            host_blacklist: []
        },
        {
            message: 'Некорректный email адрес'
        }
    )
    email: string
}
