import { IsInt, IsPositive } from 'class-validator'

export class GetByIdDto {
    @IsInt({
        message: 'ID должен быть строкой'
    })
    @IsPositive({
        message: 'ID должен быть положительным числом'
    })
    id: number
}
