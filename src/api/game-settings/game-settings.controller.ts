import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe
} from '@nestjs/common'
import { Auth } from '@/common/decorators'
import { ROLES } from '@/api/user/user.constants'
import { GameSettingsService } from './game-settings.service'
import { CreateGameSettingDto } from './dto/create.dto'
import { UpdateGameSettingDto } from './dto/update.dto'

@Controller('game-settings')
export class GameSettingsController {
  constructor(private readonly gs: GameSettingsService) {}

  @Auth(ROLES.ADMIN)
  @Get(':gameId')
  get(@Param('gameId', ParseIntPipe) gameId: number) {
    return this.gs.getByGameId(gameId)
  }

  @Auth(ROLES.ADMIN)
  @Post()
  create(@Body() dto: CreateGameSettingDto) {
    return this.gs.create(dto)
  }

  @Auth(ROLES.ADMIN)
  @Put(':gameId')
  update(
    @Param('gameId', ParseIntPipe) gameId: number,
    @Body() dto: UpdateGameSettingDto
  ) {
    return this.gs.update(gameId, dto)
  }
}
