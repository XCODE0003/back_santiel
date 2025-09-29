import {
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Response } from 'express'

import { LogsService } from '../logs/logs.service'
import { UserService } from '../user/user.service'

import { AuthDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
    EXPIRE_DAY_REFRESH_TOKEN = 1
    REFRESH_TOKEN_NAME = 'accessToken'

    constructor(
        private readonly jwt: JwtService,
        private readonly userService: UserService,
        private readonly configService: ConfigService,
        private readonly logs: LogsService
    ) {}

    async login(req: Request, ip: string, dto: AuthDto) {
        const user = await this.validateUser(dto)

        const token = await this.issueToken(user.id)

        await this.userService.createAuthorization(req, ip, user.id)

        user['accessToken'] = token.accessToken

        await this.logs.add('client', user.id, 'Авторизовался')

        return { user, token }
    }

    async register(req: Request, ip: string, dto: AuthDto) {
        const oldUser = await this.userService.getByEmail(dto.email)

        if (oldUser) throw new BadRequestException('This user already exists')

        const user = await this.userService.create(dto)

        const token = await this.issueToken(user.id)

        await this.userService.createAuthorization(req, ip, user.id)

        user['accessToken'] = token.accessToken

        await this.logs.add('client', user.id, 'Зарегистрировался')

        return { user, token }
    }

    async issueToken(userId: number) {
        const user = await this.userService.getById(userId)

        const accessToken = this.jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            {
                expiresIn: '1h',
                secret: this.configService.get<string>('JWT_SECRET')
            }
        )

        return { accessToken }
    }

    addRefreshTokenToResponse(
        res: Response,
        refreshToken: { accessToken: string }
    ) {
        const expiresIn = new Date()
        expiresIn.setDate(expiresIn.getDate() + this.EXPIRE_DAY_REFRESH_TOKEN)

        res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
            httpOnly: true,
            domain: this.configService.get<string>('SERVER_DOMAIN'),
            expires: expiresIn,
            secure: true,
            sameSite: 'none'
        })
    }

    removeRefreshTokenFromResponse(res: Response) {
        res.cookie(this.REFRESH_TOKEN_NAME, '', {
            httpOnly: true,
            domain: this.configService.get<string>('SERVER_DOMAIN'),
            expires: new Date(0),
            secure: true,
            sameSite: 'none'
        })
    }

    private async validateUser(dto: AuthDto) {
        const user = await this.userService.getByEmail(dto.email)

        if (!user) throw new NotFoundException('User not found')

        return user
    }
}
