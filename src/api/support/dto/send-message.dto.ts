import { Type } from 'class-transformer'
import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
    MinLength
} from 'class-validator'

export class SendMessageDto {
    @IsString({
        message: 'Message must be a string'
    })
    @MinLength(2, {
        message: 'Message is too short. Please enter at least 2 characters'
    })
    @MaxLength(1000, {
        message: 'Message is too long. Please enter at most 1000 characters'
    })
    @IsNotEmpty({
        message: 'Message is required'
    })
    message!: string

    @IsOptional()
    @Type(() => Number)   // чтобы '123' из JSON стал number при transform:true
    @IsInt()
    attachmentId?: number | null
}
