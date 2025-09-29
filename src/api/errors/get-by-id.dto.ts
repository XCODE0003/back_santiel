import { IsInt, IsPositive } from 'class-validator'

export class GetErrorByIdParamsDto {
    @IsInt({
        message: 'ID должен быть целым числом'
    })
    @IsPositive({
        message: 'ID должен быть положительным числом'
    })
    userId: number

    /*
    @IsInt({
        message: 'Error ID должен быть целым числом'
    })
    @IsPositive({
        message: 'Error ID должен быть положительным числом'
    })
    errorId: number
     */
}
