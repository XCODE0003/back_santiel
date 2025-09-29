import { IsInt, IsPositive } from 'class-validator'

export class GetUserAuthorizationsDto {
    @IsInt({
        message: 'ID должен быть целым числом'
    })
    @IsPositive({
        message: 'ID должен быть положительным числом'
    })
    id: number

    @IsInt({
        message: 'Page должен быть целым числом'
    })
    @IsPositive({
        message: 'Page должен быть положительным числом'
    })
    page: number = 1
}
