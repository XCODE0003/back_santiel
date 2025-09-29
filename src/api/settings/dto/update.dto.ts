import { IsNumber, IsPositive } from 'class-validator'

export class UpdateSettingParamsDto {
    @IsNumber()
    @IsPositive()
    id: number
}

export class UpdateSettingDto {
    value: string
}
