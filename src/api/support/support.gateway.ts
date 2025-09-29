import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage, MessageBody, ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Injectable, Logger } from '@nestjs/common'
import { SupportService } from './support.service'
  import { LlmService } from './llm.service'

@Injectable()
@WebSocketGateway({
  namespace: '/support',
  cors: { origin: true, credentials: false },
})
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server
  private readonly logger = new Logger(SupportGateway.name)

  constructor(
    private readonly supportService: SupportService,
    private readonly llm: LlmService,
  ) {}

  async handleConnection(client: Socket) {
    const userId = Number(client.handshake.query.userId ?? 0)
    if (!userId) return client.disconnect()
    ;(client as any).userId = userId
    client.join(`support:${userId}`)

    const res = await this.supportService.getMessages(userId, 0)
    client.emit('history', res.messages)
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  @SubscribeMessage('getHistory')
  async onGetHistory(@ConnectedSocket() client: Socket, @MessageBody() data: { lastMessageId?: number }) {
    const userId = (client as any).userId as number
    const last = Number(data?.lastMessageId ?? 0)
    return this.supportService.getMessages(userId, last)
  }

  @SubscribeMessage('sendMessage')
  async onSendMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { message: string }) {
    const userId = (client as any).userId as number

    // 1) сохраняем и рассылаем сообщение пользователя
    const res = await this.supportService.sendMessage(userId, { message: data.message } as any)
    if (res?.success && res.message) {
      this.server.to(`support:${userId}`).emit('newMessage', res.message)
    }

    // 2) включаем индикатор печати
    this.emitTyping(userId, { role: 'BOT', isTyping: true })

    try {
      // 3) собираем контекст
      const ctx = await this.supportService.getRecentForContext(userId, 20)
      const chat = ctx.map(r => ({
        role: r.role === 'BOT' ? 'assistant' : r.role === 'USER' ? 'user' : 'system',
        content: r.message,
      })) as { role: 'user'|'assistant'|'system'; content: string }[]

      // 4) получаем ответ LLM (английский «человеческий» ответ)
      const answer = await this.llm.generateReply(chat)

      // 5) сохраняем и рассылаем ответ
      const botMsg = await this.supportService.createBotMessage(userId, answer)
      this.server.to(`support:${userId}`).emit('newMessage', botMsg)
    } finally {
      // 6) выключаем индикатор печати
      this.emitTyping(userId, { role: 'BOT', isTyping: false })
    }

    return res
  }

  emitTyping(userId: number, payload: { role: 'BOT' | 'ADMIN' | 'USER'; isTyping: boolean }) {
    this.server.to(`support:${userId}`).emit('typing', payload)
  }
}
