import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Public } from '@/common/decorators/public.decorator'

@Controller('deposits/ipn')
export class TatumWebhookController {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  @Public()
  @Post('tatum')
  @HttpCode(200)
  async handle(@Headers() headers: any, @Body() body: any) {
    const secret = this.config.get<string>('TATUM_WEBHOOK_SECRET');
    if (body?.secret !== secret) return;

    const addrRaw = String(body?.address || '');
    const txId = String(body?.txId || body?.txHash || '');
    const amountStr = String(body?.amount || body?.value || '0');
    if (!addrRaw || !txId || amountStr === '0') return;

    let deposit = await this.prisma.deposit.findFirst({
      where: { address: addrRaw, status: 'pending' },
      include: { coin: true },
    });

    if (!deposit && addrRaw.startsWith('0x')) {
      deposit = await this.prisma.deposit.findFirst({
        where: { address: addrRaw.toLowerCase(), status: 'pending' },
        include: { coin: true },
      });
    }

    if (!deposit) return;

    const usd = (Number(amountStr) * Number(deposit.coin.price)).toFixed(6);

    await this.prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        txId,
        amount: amountStr as any,
        sum: usd as any,           // сумма в USD
        status: 'confirmed',
      },
    });

    await this.prisma.user.update({
      where: { id: deposit.userId },
      data: { balance: { increment: usd as any } }, // баланс в USD
    });

    return { ok: true };
  }
}