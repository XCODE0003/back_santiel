import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // id — строковый, чтобы в API стабильно ссылаться: "plinko"
  await prisma.games.upsert({
    where: { id: 'plinko' },
    update: {},
    create: {
      id: 'plinko',
      name: 'Plinko',
      kind: 'PLINKO',
      is_active: true,
      volatility: 'MEDIUM',
      min_bet: 1,
      max_bet: 1000,
      house_edge: 1.0, // %
      // базовый конфиг: 12 рядов, 13 слотов (примерные множители)
      config: {
        rows: 12,
        // слева-направо; от более безопасных к “редким” крупным
        multipliers: [0.2, 0.5, 0.7, 0.9, 1.0, 2.0, 5.0, 2.0, 1.0, 0.9, 0.7, 0.5, 0.2],
        // опционально: фиксированные позиции пегов для клиентской отрисовки
        pegSpacingX: 40,
        pegSpacingY: 34,
        pegRadius: 4
      },
      rtp_adjust_min: 0, // «подкрутка» (в процентах)
      rtp_adjust_max: 0,
    },
  })
  console.log('Plinko game seeded.')
}
main().finally(() => prisma.$disconnect())