import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';

@Injectable()
export class AmlService {
  constructor(private prisma: PrismaService) {}

  async verifyCode(userId: number, code: string) {
    const record = await this.prisma.amlVerification.findUnique({
      where: { code },
    });
    if (!record || record.status !== 'pending') {
      throw new BadRequestException('Неверный или просроченный код');
    }

    // помечаем как verified
    await this.prisma.amlVerification.update({
      where: { id: record.id },
      data: {
        status: 'verified',
        verifiedAt: new Date(),
      }
    });

    // обновляем флаг у пользователя
    await this.prisma.user.update({
      where: { id: userId },
      data: { isAmlVerified: true },
    });

    return { success: true, message: 'Подтверждение прошло успешно' };
  }

  async getStatus(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isAmlVerified: true },
    });
    return { isAmlVerified: user.isAmlVerified };
  }
}