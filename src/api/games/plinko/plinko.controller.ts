// src/api/plinko/plinko.controller.ts
import { Body, Controller, Post } from '@nestjs/common'
import { PlinkoService } from './plinko.service'
import { PlayDto } from '@/api/games/plinko/dto/play.dto'
// import { Auth } from '@/common/decorators' // если нужен JWT
// import { ROLES } from '@/api/user/user.constants'

@Controller('games/plinko')
export class PlinkoController {
  constructor(private readonly svc: PlinkoService) {}

  // @Auth(ROLES.USER)
  @Post('play')
  async play(@Body() dto: PlayDto) {
    // userId возьми из JWT/req.user — пока для прототипа жёстко:
    const userId = 1
    return this.svc.play(userId, dto)
  }
}
