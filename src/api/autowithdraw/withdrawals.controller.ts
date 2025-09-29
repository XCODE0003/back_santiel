import { Controller, Get, Param, Post, Body } from '@nestjs/common'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { AutoWithdrawService } from './withdrawals.service'

@Controller('withdrawals')
export class WithdrawalsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoWithdrawService: AutoWithdrawService
  ) {}

  @Get(':userId')
  async getUserWithdrawals(@Param('userId') userId: number) {
    return this.prisma.withdrawal.findMany({
      where: { user_id: userId },         // было userId
      orderBy: { created_at: 'desc' }      // было createdAt
    })
  }

  @Post('manual')
  async manualWithdraw(@Body() body: { depositId: number }) {
    await this.autoWithdrawService.autoWithdraw(body.depositId)
    return { message: 'Manual withdrawal triggered' }
  }
}
