import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { CreateGameSettingDto } from './dto/create.dto'
import { UpdateGameSettingDto } from './dto/update.dto'

@Injectable()
export class GameSettingsService {
  private readonly logger = new Logger(GameSettingsService.name)
  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.logger = new Logger(GameSettingsService.name)
  }

  /** Если настроек нет — создаём их с 0/0, иначе возвращаем существующие */
  async getByGameId(gameId: number) {
    let setting = await this.prisma.gameSetting.findFirst({
      where: { gameId }
    })

    if (!setting) {
      setting = await this.prisma.gameSetting.create({
        data: {
          gameId,
          minAdjustPercent: 0,
          maxAdjustPercent: 0
        }
      })
    }

    return setting
  }

  async create(dto: CreateGameSettingDto) {
    return this.prisma.gameSetting.create({
      data: {
        gameId: dto.gameId,
        minAdjustPercent: dto.minAdjustPercent,
        maxAdjustPercent: dto.maxAdjustPercent
      }
    })
  }

  async update(gameId: number, dto: UpdateGameSettingDto) {
    const exists = await this.prisma.gameSetting.findFirst({ where: { gameId } })
    if (!exists) {
      // если кто-то вдруг вызывает PUT до того, как мы авто-создали в getByGameId,
      // то просто создаём
      return this.prisma.gameSetting.create({
        data: {
          gameId,
          minAdjustPercent: dto.minAdjustPercent,
          maxAdjustPercent: dto.maxAdjustPercent
        }
      })
    }
    return this.prisma.gameSetting.update({
      where: { id: exists.id },
      data: {
        minAdjustPercent: dto.minAdjustPercent,
        maxAdjustPercent: dto.maxAdjustPercent
      }
    })
  }

  /**
   * Применяет «подкрутку» к базовому выигрышу (baseWin):
   * - Считывает min/max adjustment из game_settings
   * - Генерирует случайный delta в этом диапазоне
   * - Вычисляет adjustedWin = baseWin * (1 + delta/100)
   * - Не допускает уход баланса пользователя в минус
   * - Сохраняет запись в game_history
   */
  // async processResult(
  //   userId: number,
  //   gameId: number,
  //   baseWin: number,
  //   betAmount: number,
  // ): Promise<{ adjustedWin: number; delta: number }> {
  //   // 1) Читаем настройки
  //   const { minAdjustPercent, maxAdjustPercent } = await this.getByGameId(gameId);

  //   // 2) Генерируем случайное delta
  //   const delta =
  //     minAdjustPercent +
  //     Math.random() * (maxAdjustPercent - minAdjustPercent);

  //   // 3) Вычисляем скорректированный результат
  //   let adjustedWin = baseWin * (1 + delta / 100);
  //   // Округляем до, скажем, 6 знаков после запятой
  //   adjustedWin = parseFloat(adjustedWin.toFixed(6));

  //   // 4) Проверяем, что у пользователя не уйдёт в минус
  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //     select: { balance: true },
  //   });
  //   const currentBalance = Number(user.balance);
  //   if (currentBalance + adjustedWin < 0) {
  //     // если после проигрыша баланса не хватит — обнуляем проигрыш
  //     adjustedWin = -currentBalance;
  //   }

  //   // 5) Записываем историю игры (после «подкрутки»)
  //   await this.prisma.gameHistory.create({
  //     data: {
  //       user: userId,
  //       slot: gameId,
  //       bet: betAmount,
  //       win: adjustedWin,
  //     },
  //   });

  //   this.logger.log(
  //     `Game ${gameId}, user ${userId}: baseWin=${baseWin}, delta=${delta.toFixed(
  //       2,
  //     )}%, adjustedWin=${adjustedWin}`,
  //   );

  //   return { adjustedWin, delta };
  // }

  async processResult(
    userId: number,
    gameId: number,
    baseWin: number,
    betAmount: number,
  ): Promise<{ adjustedWin: number; delta: number }> {
    try {
      // 1) Получаем настройки
      const { minAdjustPercent, maxAdjustPercent } =
        await this.getByGameId(gameId)

      // 2) Генерируем delta
      const delta =
        minAdjustPercent + Math.random() * (maxAdjustPercent - minAdjustPercent)

      // 3) Вычисляем adjustedWin
      let adjustedWin = baseWin * (1 + delta / 100)
      adjustedWin = parseFloat(adjustedWin.toFixed(6))

      // 4) Проверяем баланс пользователя
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      })

      if (!user) throw new Error(`User ${userId} not found`)
      const currentBalance = Number(user.balance)

      if (currentBalance + adjustedWin < 0) {
        adjustedWin = -currentBalance
      }

      // 5) Обновляем баланс пользователя
      await this.prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: adjustedWin } }
      })

      // 6) Записываем историю
      await this.prisma.gameHistory.create({
        data: {
          user: userId,
          slot: gameId,
          bet: betAmount,
          win: adjustedWin
        }
      })

      this.logger.log(
        `Game ${gameId}, user ${userId}: baseWin=${baseWin}, delta=${delta.toFixed(
          2
        )}%, adjustedWin=${adjustedWin}`
      )

      return { adjustedWin, delta }

    } catch (error) {
      this.logger.error(
        `processResult failed for user=${userId}, game=${gameId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }
}
