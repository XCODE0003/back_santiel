import { Controller, Get, Query } from '@nestjs/common'

import { ROLES } from '@/api/user/user.constants'
import { Auth, CurrentUser } from '@/common/decorators'

import { TransactionsService } from './transactions.service'

@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) {}

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Get()
    async getAllTransactions(
        @CurrentUser('role') role: ROLES,
        @CurrentUser('id') userId: number,
        @Query('page') page: number = 1,
        @Query('typeId') typeId: number = 0
    ) {
        if (role === ROLES.WORKER) {
            return this.transactionsService.getByWorkerId(userId, typeId, page)
        }

        return this.transactionsService.getAll(typeId, page)
    }
}
