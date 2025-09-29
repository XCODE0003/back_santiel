import { BadRequestException, Injectable } from '@nestjs/common'
import { LogsService } from '@/api/logs/logs.service'
import { UploadService } from '@/api/upload/upload.service'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { SendMessageDto } from './dto/send-message.dto'

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
    private readonly logs: LogsService,
  ) {}

  async getMessages(userId: number, lastMessageId: number) {
    const messages = await this.prisma.support.findMany({
      where: { userId, id: { gt: lastMessageId } },
      orderBy: { id: 'asc' },
    })
    return { success: true, messages }
  }

  async sendMessage(userId: number, dto: SendMessageDto) {
    if (dto.attachmentId != null && !(await this.upload.isOwner(dto.attachmentId, userId))) {
      throw new BadRequestException('Attachment not found')
    }
    await this.logs.add('client', userId, 'Wrote a message to support')

    const msg = await this.prisma.support.create({
      data: { userId, role: 'USER', message: dto.message, attachmentId: dto.attachmentId ?? null },
    })
    return { success: true, message: msg }
  }

  async createBotMessage(userId: number, text: string) {
    return this.prisma.support.create({
      data: { userId, role: 'BOT', message: text, attachmentId: null },
    })
  }

  async getRecentForContext(userId: number, limit = 20) {
    const rows = await this.prisma.support.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      take: limit,
      select: { role: true, message: true },
    })
    return rows.reverse()
  }
}
