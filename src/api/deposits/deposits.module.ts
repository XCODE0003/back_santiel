import { Module }                 from '@nestjs/common'
import { PrismaModule }           from '@/infra/prisma/prisma.module'
import { DepositsController }     from './deposits.controller'
import { DepositsService }        from './deposits.service'
import { DepositMonitorService }  from './deposit-monitor.service'
import { ConfigModule } from '@nestjs/config'
import { WithdrawalsModule } from '../autowithdraw/withdrawals.module'
import { TatumService } from '@/common/services/tatum/tatum.service'
import { TatumWebhookController } from './tatum-webhook.controller'

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    WithdrawalsModule,
  ],
  controllers: [DepositsController, TatumWebhookController],
  providers: [DepositsService, DepositMonitorService, TatumService],
})
export class DepositsModule {}