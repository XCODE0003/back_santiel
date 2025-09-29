import { Injectable } from '@nestjs/common'
import { Server, Socket } from 'socket.io'

@Injectable()
export class EventsService {
    private server: Server
    private clients: Map<number, Socket> = new Map()
    private instanceId = Math.random().toString(36).substring(2)

    setServer(server: Server) {
        this.server = server
        console.log(`Server set in instance ${this.instanceId}`)
    }

    registerClient(client: Socket, userId: number) {
        this.clients.set(userId, client)
        console.log(
            `Registered client in instance ${this.instanceId}, clients:`
        )
    }

    unregisterClient(userId: number) {
        this.clients.delete(userId)
        console.log(`Unregistered client in instance ${this.instanceId}`)
    }

    updateUserBalance(userId: number, balance: number) {
        console.log(
            `updateUserBalance in instance ${this.instanceId}, clients:`,
            Array.from(this.clients.entries())
        )
        const client = this.clients.get(userId)
        if (client) {
            client.emit('balanceUpdate', { userId, balance })
            console.log(`Sent balance update to user ${userId}: ${balance}`)
        } else {
            console.log(`User ${userId} not connected`)
        }
    }
}
