import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { ScheduleModule } from '@nestjs/schedule'
import { ServeStaticModule } from '@nestjs/serve-static'
import { NestjsFormDataModule } from 'nestjs-form-data'
import { join } from 'path'

import { AccountsModule } from '@/api/accounts/accounts.module'
import { AnswersModule } from '@/api/answers/answers.module'
import { AuthModule } from '@/api/auth/auth.module'
import { ConfigsModule } from '@/api/configs/configs.module'
import { CountriesModule } from '@/api/countries/countries.module'
import { DomainsModule } from '@/api/domains/domains.module'
import { PagesModule } from '@/api/pages/pages.module'
import { PromocodeModule } from '@/api/promocode/promocode.module'
import { SettingsModule } from '@/api/settings/settings.module'
import { SupportModule } from '@/api/support/support.module'
import { TransactionsModule } from '@/api/transactions/transactions.module'
import { AppService } from '@/app.service'
import { EventsModule } from '@/events/events.module'

import { BlogModule } from './api/blog/blog.module'
import { CoinsModule } from './api/coins/coins.module'
import { DepositsModule } from './api/deposits/deposits.module'
import { ErrorsModule } from './api/errors/errors.module'
import { LogsModule } from './api/logs/logs.module'
import { SeedsModule } from './api/seeds/seeds.module'
import { SlotsModule } from './api/slots/slots.module'
import { UploadModule } from './api/upload/upload.module'
import { UserModule } from './api/user/user.module'
import {RolesGuard} from "@/common/guards/roles.guard";
import {APP_GUARD} from "@nestjs/core";
import { FaqModule } from './api/faq/faq.module'
import { WithdrawalsModule } from './api/autowithdraw/withdrawals.module'
import { JwtAuthGuard } from './api/auth/guards/jwt-auth.guard'
import { RpcListenerService } from './common/services/rpc-listener.service'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { SocketGateway } from './gateways/socket.gateway'
import { GameSettingsModule } from './api/game-settings/game-settings.module'
import { GameLogicModule } from './api/game-logic/game-logic.module'
import { AmlModule } from './api/aml/aml.module'
import { PlinkoModule } from './api/games/plinko/plinko.module'

const MODE = process.env.NODE_ENV || 'dev'

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: `.env.${MODE}`,
            isGlobal: true
        }),
        JwtModule.register({
            // TODO: replace process.env with configService
            secret: process.env.JWT_SECRET || 'defaultSecret',
            signOptions: { expiresIn: '24h' },
            global: true
        }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'static'),
            serveRoot: '/api/v1/static'
        }),
        NestjsFormDataModule,
        ScheduleModule.forRoot(),
        LogsModule,
        UserModule,
        AuthModule,
        UploadModule,
        CountriesModule,
        SupportModule,
        BlogModule,
        AccountsModule,
        DomainsModule,
        PromocodeModule,
        ErrorsModule,
        TransactionsModule,
        DepositsModule,
        SlotsModule,
        EventsModule,
        ConfigsModule,
        CoinsModule,
        SeedsModule,
        AnswersModule,
        PagesModule,
        SettingsModule,
        FaqModule,
        WithdrawalsModule,
        PrismaModule,
        GameSettingsModule,
        GameLogicModule,
        AmlModule,
        PlinkoModule
    ],
    providers: [
        AppService,
        RpcListenerService,
        SocketGateway,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard
        }
    ]
})
export class AppModule {}
