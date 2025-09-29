import { Module, forwardRef } from '@nestjs/common'
import { PrismaModule }        from '@/infra/prisma/prisma.module'
import { UserModule }          from '@/api/user/user.module'
import { GameLogicService }    from './game-logic.service'

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => UserModule),
  ],
  providers: [GameLogicService],
  exports: [GameLogicService],
})
export class GameLogicModule {}