import { Controller, Get, Query } from '@nestjs/common'

import { GetAllDepositsDto } from '@/api/deposits/dto/get-all'
import { ROLES } from '@/api/user/user.constants'
import { Auth, CurrentUser } from '@/common/decorators'

import { DepositsService } from './deposits.service'

@Controller('deposits')
export class DepositsController {
    constructor(private readonly depositsService: DepositsService) {}

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Get()
    async getDeposits(
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: ROLES,
        @Query() dto: GetAllDepositsDto
    ) {
        if (role == ROLES.WORKER) {
            return await this.depositsService.getAll(dto, userId)
        }

        return await this.depositsService.getAll(dto)
    }

    @Auth()
    @Get('address')
    async getDepositAddress(
        @CurrentUser('id') userId: number,
        @Query('coin') coinSymbol: string
    ) {
        return this.depositsService.getDepositAddress(userId, coinSymbol)
    }
}
