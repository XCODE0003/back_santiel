import { Module } from '@nestjs/common'

import { UserModule } from '@/api/user/user.module'

import { EventsGateway } from './events.gateway'
import { EventsService } from './events.service'

@Module({
    imports: [UserModule],
    providers: [EventsGateway, EventsService],
    exports: [EventsService]
})
export class EventsModule {}
