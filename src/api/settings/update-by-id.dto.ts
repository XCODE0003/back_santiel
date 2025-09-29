import { IsInt, IsPositive } from 'class-validator'

import { UpdateSettingDto } from '@/api/settings/dto/update.dto'

export class UpdateSettingByIdParams {
    @IsInt({
        message: 'ID должен быть числом'
    })
    @IsPositive({
        message: 'ID должен быть положительным числом'
    })
    id: number
}

export class UpdateSettingById extends UpdateSettingDto {
    @IsInt({
        message: 'ID должен быть числом'
    })
    @IsPositive({
        message: 'ID должен быть положительным числом'
    })
    id: number
}
