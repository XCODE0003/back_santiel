import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { PlayDto, Risk } from './dto/play.dto'
import { GameSettingsService } from '@/api/game-settings/game-settings.service'

@Injectable()
export class PlinkoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gs: GameSettingsService,
  ){}

  // простые пресеты мультипликаторов (под 12 рядов)
  private presets(rows: number, risk: Risk): number[] {
    if (rows !== 12) {
      // для простоты пока раздаём “easy12”, потом можно масштабировать биномиально
      rows = 12
    }
    const easy   = [0.2,0.5,0.7,0.9,1.0,2.0,5.0,2.0,1.0,0.9,0.7,0.5,0.2]
    const medium = [0.2,0.4,0.6,0.8,1.2,2.5,8.0,2.5,1.2,0.8,0.6,0.4,0.2]
    const hard   = [0.2,0.3,0.5,0.7,1.5,4.0,18.0,4.0,1.5,0.7,0.5,0.3,0.2]
    return risk === 'easy' ? easy : risk === 'medium' ? medium : hard
  }

  /** Весовая выборка слота: чем больше множитель, тем ниже вероятность (обратная пропорция) */
  private sampleFinalSlot(mult: number[]): number {
    const weights = mult.map(m => 1 / Math.max(m, 0.01))
    const total = weights.reduce((a,b)=>a+b,0)
    let r = Math.random() * total
    for (let i=0;i<weights.length;i++) {
      r -= weights[i]
      if (r <= 0) return i
    }
    return weights.length - 1
  }

  /** Опционально: отдать клиенту шаги 0/1 (для красоты траектории) */
  private buildPath(rows: number, finalSlot: number): number[] {
    const rights = finalSlot
    const steps = Array(rights).fill(1).concat(Array(rows - rights).fill(0))
    for (let i = steps.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[steps[i], steps[j]] = [steps[j], steps[i]]
    }
    return steps
  }

  async play(userId: number, dto: PlayDto) {
    const rows = dto.rows
    const multipliers = this.presets(rows, dto.risk)

    // списываем ставку
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { balance: true } })
    if (!user || Number(user.balance) < dto.betAmount) {
      throw new Error('Insufficient funds')
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: dto.betAmount } }
    })

    // случайный финальный слот по весам
    const finalSlot = this.sampleFinalSlot(multipliers)
    const baseWin = dto.betAmount * multipliers[finalSlot] - dto.betAmount // чистый результат

    // «подкрутка» и запись истории (используем gameId = id слота/игры, например publicId  — подставь своё)
    const GAME_ID = 999_001 // или возьми из таблицы slots/games
    const { adjustedWin } = await this.gs.processResult(userId, GAME_ID, baseWin, dto.betAmount)

    const updated = await this.prisma.user.findUnique({ where: { id: userId }, select: { balance: true } })

    // путь для Canvas
    const path = this.buildPath(rows, finalSlot)

    return {
      gameResult: adjustedWin >= 0 ? 'win' : 'lose',
      winAmount: Math.max(0, adjustedWin + dto.betAmount) - dto.betAmount, // чистый выигрыш
      updatedBalance: Number(updated?.balance ?? 0),
      multipliers,
      finalSlot,
      path,
    }
  }
}