import { Body, Controller, Get, Param, Put } from '@nestjs/common'

import { EditByIdDtoParamsDto } from '@/api/errors/dto/edit-by-id.dto'
import { EditErrorDto } from '@/api/errors/dto/edit.dto'
import { GetErrorByIdParamsDto } from '@/api/errors/get-by-id.dto'
import { ROLES } from '@/api/user/user.constants'
import { Auth, CurrentUser } from '@/common/decorators'

import { ErrorsService } from './errors.service'

@Controller('errors')
export class ErrorsController {
    constructor(private readonly errorsService: ErrorsService) {}

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Get()
    async getErrors(
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: ROLES
    ) {
        if (role === ROLES.WORKER) {
            return await this.errorsService.getWorkersErrors(userId)
        }

        return await this.errorsService.getAll()
    }

    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Put(':errorId')
    async editError(
        @CurrentUser('id') userId: number,
        @CurrentUser('role') role: ROLES,
        @Param('errorId') errorId: number,
        @Body() dto: EditErrorDto
    ) {
        if (role === ROLES.WORKER) {
            return await this.errorsService.editWorkerError(
                userId,
                errorId,
                dto
            )
        }

        return await this.errorsService.editError(errorId, dto)
    }

    //TODO: Добавить проверку на привязку worker_id
    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Get('user/:userId')
    async getErrorsByUserId(@Param() paramsDto: GetErrorByIdParamsDto) {
        return await this.errorsService.getWorkersErrors(paramsDto.userId)
    }

    //TODO: Добавить проверку на привязку worker_id
    @Auth(ROLES.WORKER, ROLES.ADMIN)
    @Put('user/:userId/:errorId')
    async editUserErrors(
        @Param() paramsDto: EditByIdDtoParamsDto,
        @Body() dto: EditErrorDto
    ) {
        return await this.errorsService.editWorkerError(
            paramsDto.userId,
            paramsDto.errorId,
            dto
        )
    }
}
