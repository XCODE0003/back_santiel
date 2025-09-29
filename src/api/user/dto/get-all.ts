import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class GetAllUsersDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Номер страницы должен быть числом' })
    @Min(1, { message: 'Номер страницы должен быть больше 0' })
    page?: number

    @IsOptional()
    search?: string
}