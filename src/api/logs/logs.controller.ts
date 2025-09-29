import { Controller, Get, Param, Query } from '@nestjs/common'

import { GetLogsByIdDto } from '@/api/logs/dto/get-by-id.dto'
import { ROLES } from '@/api/user/user.constants'
import { Auth, CurrentUser } from '@/common/decorators'

import { LogsService } from './logs.service'

@Controller('logs')
export class LogsController {
    constructor(private readonly logsService: LogsService) {}

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Get()
    async getAllLogs(
        @CurrentUser('role') role: ROLES,
        @CurrentUser('id') userId: number,
        @Query('page') page: string = '1'
    ) {
        const pageNumber = parseInt(page, 10) || 1

        if (role === ROLES.WORKER) {
            return this.logsService.getByWorkerId(userId, pageNumber)
        }

        return this.logsService.getAll(pageNumber)
    }

    @Auth(ROLES.ADMIN, ROLES.WORKER)
    @Get(':id')
    async getLogsById(@Param() queryDto: GetLogsByIdDto) {
        return this.logsService.getByWorkerId(queryDto.id, queryDto.page)
    }
}
