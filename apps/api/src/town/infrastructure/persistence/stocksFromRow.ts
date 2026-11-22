import type { Stocks } from '@mygame/domain'

export const stocksFromRow = (
  money: number,
  food: number,
  power: number,
  material: number,
): Stocks => ({
  money,
  food,
  power,
  material,
})
