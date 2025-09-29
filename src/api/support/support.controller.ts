import { Body, Controller, Get, Post, Query } from '@nestjs/common'

import { ClientGetMessagesQueryDto } from '@/api/support/dto/client-get-messages.dto'
import { Auth, CurrentUser } from '@/common/decorators'

import { SendMessageDto } from './dto/send-message.dto'
import { SupportService } from './support.service'

@Controller('support')
export class SupportController {
    constructor(private readonly supportService: SupportService) {}

    @Auth()
    @Post('send')
    async sendMessage(
        @CurrentUser('id') id: number,
        @Body() dto: SendMessageDto
    ) {
        return await this.supportService.sendMessage(id, dto)
    }

    @Auth()
    @Get()
    async getMessages(
        @Query() queryDto: ClientGetMessagesQueryDto,
        @CurrentUser('id') userId: number
    ) {
        return this.supportService.getMessages(userId, queryDto.lastMessageId)
    }
}
