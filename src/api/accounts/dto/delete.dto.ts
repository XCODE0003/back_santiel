import { IsNumber, IsPositive } from 'class-validator'

export class DeleteAccountDto {
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
        message: 'ID должен быть больше 0'
    })
    id: number
}
