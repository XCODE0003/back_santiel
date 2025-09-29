import {
    Body,
    Controller,
    HttpCode,
    Ip,
    Post,
    Req,
    Res,
    UsePipes,
    ValidationPipe
} from '@nestjs/common'
import { ApiExtraModels } from '@nestjs/swagger'
import { Response } from 'express'

import { AuthService } from './auth.service'
import { AuthDto } from './dto/auth.dto'
import { Public } from '@/common/decorators/public.decorator'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Post('register')
    @ApiExtraModels(AuthDto)
    async register(
        @Req() req: Request,
        @Ip() ip: string,
        @Body() dto: AuthDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const { token, ...response } = await this.authService.register(
            req,
            ip,
            dto
        )

        this.authService.addRefreshTokenToResponse(res, token)

        return response
    }

    @Public()
    @UsePipes(new ValidationPipe())
    @HttpCode(200)
    @Post('login')
    async login(
        @Req() req: Request,
        @Ip() ip: string,
        @Body() dto: AuthDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const { token, ...response } = await this.authService.login(
            req,
            ip,
            dto
        )

        this.authService.addRefreshTokenToResponse(res, token)

        return response
    }

    @HttpCode(200)
    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        this.authService.removeRefreshTokenFromResponse(res)
        return true
    }
}
