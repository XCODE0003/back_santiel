import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString
} from 'class-validator'

export class GetAllAriclesDto {
    @IsNumber(
        {
            allowNaN: false,
            allowInfinity: false
        },
        {
            message: 'Incorrect page number. Must be a number'
        }
    )
    @IsPositive({
        message: 'Page number must be greater than 0'
    })
    @IsNotEmpty({
        message: 'Page number is required'
    })
    page: number

    @IsOptional()
    @IsString({
        message: 'Search must be a string'
    })
    search: string
}
