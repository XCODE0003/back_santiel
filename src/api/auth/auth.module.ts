import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'

import { AuthController } from '@/api/auth/auth.controller'
import { AuthService } from '@/api/auth/auth.service'
import { JwtStrategy } from '@/api/auth/guards/jwt.strategy'
import { LogsModule } from '@/api/logs/logs.module'
import { UserModule } from '@/api/user/user.module'

@Module({
    imports: [UserModule, LogsModule],
    controllers: [AuthController],
    providers: [AuthService, JwtService, JwtStrategy, ConfigService],
    exports: [AuthService, JwtStrategy]
})
export class AuthModule {}
