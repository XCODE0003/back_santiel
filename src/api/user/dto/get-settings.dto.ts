import { IsInt, IsPositive } from 'class-validator'

export class GetSettingsDto {
    @IsInt({
        message: 'ID должен быть целым числом'
    })
    @IsPositive({
        message: 'ID должен быть положительным числом'
    })
    userId: number
}
