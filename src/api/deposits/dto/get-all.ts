import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator'

export class GetAllDepositsDto {
    @IsNumber(
        {
            allowNaN: false,
            allowInfinity: false
        },
        {
            message: 'Page must be a number'
        }
    )
    @IsPositive({
        message: 'Page must be a positive number'
    })
    page: number

    @IsOptional()
    @IsString({
        message: 'Search must be a string'
    })
    search: string
}
