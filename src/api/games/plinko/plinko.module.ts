import { Module } from '@nestjs/common'
import { PrismaModule } from '@/infra/prisma/prisma.module'
import { GameSettingsModule } from '@/api/game-settings/game-settings.module'
import { PlinkoController } from './plinko.controller'
import { PlinkoService } from './plinko.service'

@Module({
  imports: [PrismaModule, GameSettingsModule],
  controllers: [PlinkoController],
  providers: [PlinkoService],
})
export class PlinkoModule {}