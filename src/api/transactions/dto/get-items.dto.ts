import { IsNumber, IsPositive } from 'class-validator'

import { ROLES } from '@/api/user/user.constants'

export class GetTransactionsDto {
    @IsNumber()
    @IsPositive()
    userId: number

    @IsNumber()
    @IsPositive()
    page: number

    @IsNumber()
    @IsPositive()
    role: ROLES
}
