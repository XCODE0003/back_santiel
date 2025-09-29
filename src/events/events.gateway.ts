import { JwtService } from '@nestjs/jwt'
import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

import { ROLES } from '@/api/user/user.constants'
import { UserService } from '@/api/user/user.service'
import { WS_AUTH_KEY, WsAuth } from '@/common/decorators/ws-auth.decorator'

import { EventsService } from './events.service'

@WebSocketGateway({
    namespace: 'events',
    cors: {
        origin: (
            requestOrigin: string | undefined,
            callback: (err: Error | null, allow?: boolean) => void
        ) => callback(null, true),
        methods: ['GET', 'POST'],
        credentials: true
    }
})
export class EventsGateway {
    @WebSocketServer()
    server: Server

    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
        private readonly eventsService: EventsService
    ) {
        this.eventsService.setServer(this.server)
    }

    afterInit(server: Server) {
        server.use(async (socket: Socket, next) => {
            try {
                this.eventsService.setServer(this.server)

                const authHeader = socket.handshake.headers['authorization']
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return next(new WsException('No token provided'))
                }

                const token = authHeader.split(' ')[1]
                const payload = this.jwtService.verify(token, {
                    secret: process.env.JWT_SECRET || 'defaultSecret'
                })

                const user = await this.userService.getById(payload.id)
                if (!user) {
                    return next(new WsException('User not found'))
                }

                socket['user'] = user
                this.eventsService.registerClient(socket, user.id)

                console.log(
                    `User ${user.id} connected: ${socket.id} fasdfasdfadsfadsf`
                )

                next()
            } catch (error) {
                return next(new WsException('Invalid token'))
            }
        })
    }

    handleConnection(client: Socket) {
        console.log(
            `Client connected: ${client.id}, User: ${client['user'].id}`
        )
    }

    handleDisconnect(client: Socket) {
        const userId = client['user'].id
        this.eventsService.unregisterClient(userId) // Удаляем клиента
        console.log(`Client disconnected: ${client.id}`)
    }

    @SubscribeMessage('spin')
    @WsAuth(ROLES.ADMIN)
    handleSpin(client: Socket, payload: any) {
        this.checkRoles(client, this.handleSpin)
        console.log('Spin event:', payload)
        this.server.emit('slotEvent', { result: 'You won!' })
    }

    private checkRoles(socket: Socket, handler: Function) {
        const requiredRoles = Reflect.getMetadata(WS_AUTH_KEY, handler) || []
        const user = socket['user']
        if (
            requiredRoles.length > 0 &&
            !requiredRoles.some(role => user.role.includes(role))
        ) {
            throw new WsException('Insufficient permissions')
        }
    }
}
