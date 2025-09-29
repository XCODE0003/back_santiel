import { Transform } from 'class-transformer'
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength
} from 'class-validator'

export class GetAllSlotsDto {
    @IsOptional()
    @Transform(({ value }) => Number(value)) // приводит строку к числу
    @IsNumber({}, { message: 'Incorrect page number' })
    @IsPositive({ message: 'Page number must be positive' })
    page: number = 1

    @IsOptional()
    @IsString({
        message: 'Search must be a string'
    })
    @MaxLength(64, {
        message: 'Search must be less than 64 characters'
    })
    search: string
}
