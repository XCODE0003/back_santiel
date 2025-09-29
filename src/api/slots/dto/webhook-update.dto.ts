import { IsNumber, IsPositive, IsString, IsUUID } from 'class-validator'

export class WebhookUpdateDto {
    @IsString()
    @IsUUID('4', {
        message: 'Session ID must be a valid UUID'
    })
    sessionId: string

    @IsNumber()
    @IsPositive({
        message: 'Balance must be positive'
    })
    balance: number

    @IsNumber()
    @IsPositive({
        message: 'Balance cash must be positive'
    })
    balanceCash: number

    @IsNumber()
    @IsPositive({
        message: 'Balance bonus must be positive'
    })
    balanceBonus: number
}
