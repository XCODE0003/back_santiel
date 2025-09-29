import { IsInt, IsPositive } from 'class-validator'

import { GetErrorByIdParamsDto } from '@/api/errors/get-by-id.dto'

export class EditByIdDtoParamsDto extends GetErrorByIdParamsDto {
    @IsInt({
        message: 'Error ID должен быть целым числом'
    })
    @IsPositive({
        message: 'Error ID должен быть положительным числом'
    })
    errorId: number
}
