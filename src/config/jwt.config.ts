import { ConfigService } from '@nestjs/config'
import { JwtModuleOptions } from '@nestjs/jwt'

// TODO: remove this function since there's no usage of it
export const getJwtConfig = (
    configService: ConfigService
): JwtModuleOptions => ({
    secret: configService.get<string>('JWT_SECRET')
})
