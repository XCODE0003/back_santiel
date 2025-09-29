import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query
} from '@nestjs/common'

import { CreateAccountDto } from '@/api/accounts/dto/create.dto'
import { DeleteAccountDto } from '@/api/accounts/dto/delete.dto'
import {
    EditAccountDto,
    EditAccountParamsDto
} from '@/api/accounts/dto/edit.dto'
import { GetAccountsDto } from '@/api/accounts/dto/get.dto'
import { ROLES } from '@/api/user/user.constants'
import { Auth } from '@/common/decorators'

import { AccountsService } from './accounts.service'

@Controller('accounts')
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) {}

    @Auth(ROLES.ADMIN)
    @Get('items')
    async getAllItems() {
        return this.accountsService.getItems()
    }

    @Auth(ROLES.ADMIN)
    @Get()
    async getAll(@Query() dto: GetAccountsDto) {
        return this.accountsService.getAll(dto)
    }

    @Auth(ROLES.ADMIN)
    @Post('create')
    async create(@Body() dto: CreateAccountDto) {
        await this.accountsService.create(dto)

        return {
            message: 'Аккаунт был успешно добавлен'
        }
    }

    @Auth(ROLES.ADMIN)
    @Put(':id')
    async edit(
        @Param('id') paramsDto: EditAccountParamsDto,
        @Body() dto: EditAccountDto
    ) {
        dto.id = paramsDto.id

        await this.accountsService.edit(dto)

        return {
            message: 'Аккаунт успешно отредактирован'
        }
    }

    @Auth(ROLES.ADMIN)
    @Delete(':id')
    async remove(@Param() dto: DeleteAccountDto) {
        await this.accountsService.delete(dto)

        return {
            message: 'Аккаунт был успешно удален'
        }
    }
}
