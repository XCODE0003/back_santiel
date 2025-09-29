// src/api/slots/slots.module.ts
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { NestjsFormDataModule } from 'nestjs-form-data'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { UserModule } from '@/api/user/user.module'
import { LogsModule } from '@/api/logs/logs.module'
import { SlotsService } from './slots.service'
import { SlotsController } from './slots.controller'
import { GameLogicModule } from '@/api/game-logic/game-logic.module'

@Module({
  imports: [
    PrismaModule,
    UserModule,
    LogsModule,
    GameLogicModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '2h' },
      }),
    }),

    // Вместо autoDeleteFileOnError — cleanupAfterFailedHandle
    NestjsFormDataModule.config({
      // очистить файлы после успешной обработки
      cleanupAfterSuccessHandle: true,
      // очистить файлы после ошибки
      cleanupAfterFailedHandle: true,
      // для обратной совместимости можно добавить deprecated-опцию
      autoDeleteFile: true,
      // если нужен глобальный модуль
      isGlobal: false,
    }),
  ],
  controllers: [SlotsController],
  providers: [SlotsService],
})
export class SlotsModule {}
