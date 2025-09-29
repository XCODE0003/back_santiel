import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { UserService } from '@/api/user/user.service'

@Injectable()
export class GameLogicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService
  ) {}

  /**
   * Рассчитывает «подкрученный» выигрыш (или проигрыш):
   * - берёт из game_settings min/max
   * - генерирует delta ∈ [min, max]
   * - adjusted = baseWin * (1 + delta/100)
   * - не даёт уйти в отрицательный баланс
   * - обновляет баланс и записывает историю
   */
  async processResult(
    userId: number,
    gameId: number,
    baseWin: number,
    betAmount: number
  ): Promise<{ adjustedWin: number; delta: number }> {
    // 1) получаем настройки для игры
    const setting = await this.prisma.gameSetting.findFirst({
      where: { gameId }
    })

    const minAdj = setting?.minAdjustPercent ?? 0
    const maxAdj = setting?.maxAdjustPercent ?? 0

    // 2) генерируем delta в процентах
    const delta = Math.random() * (maxAdj - minAdj) + minAdj

    // 3) рассчитываем «подкрученный» выигрыш
    let adjustedWin = baseWin * (1 + delta / 100)

    // 4) приводим баланс к number и проверяем, не уйдёт ли в минус
    const balanceDecimal = await this.userService.getBalanceById(userId)
    // если getBalanceById отдаёт Prisma.Decimal:
    const balance = typeof balanceDecimal === 'number'
      ? balanceDecimal
      : balanceDecimal.toNumber()

    if (balance + adjustedWin < 0) {
      adjustedWin = -balance
    }

    // 5) обновляем баланс (предполагаем, что метод принимает number)
    await this.userService.updateBalanceById(userId, adjustedWin)

    // 6) сохраняем в историю
    await this.prisma.gameHistory.create({
      data: {
        user: userId,
        slot: gameId,    // если gameId соответствует slot_id
        bet: betAmount,
        win: adjustedWin
      }
    })

    return {
      adjustedWin,
      delta: Number(delta.toFixed(2))
    }
  }
}