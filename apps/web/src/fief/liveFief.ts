import type { FiefOverview, ResourceKind } from '@mygame/contracts'

export type LiveAmounts = Readonly<Record<ResourceKind, number>>

export interface LiveFief {
  readonly overview: FiefOverview
  readonly amounts: LiveAmounts
  readonly slotRemainingSeconds: number
}

const secondsPerHour = 3600

const amountAfter = (
  { amount, ratePerHour, capacity }: FiefOverview['resources']['wood'],
  elapsedSeconds: number,
): number =>
  Math.max(amount, Math.min(capacity, amount + (ratePerHour * elapsedSeconds) / secondsPerHour))

export function slotRemainingSecondsAt(overview: FiefOverview, elapsedSeconds: number): number {
  if (overview.slot.kind === 'idle') {
    return 0
  }
  const atReadSeconds = (Date.parse(overview.slot.finishesAt) - Date.parse(overview.readAt)) / 1000
  return Math.max(0, atReadSeconds - elapsedSeconds)
}

export function liveFiefAt(overview: FiefOverview, elapsedSeconds: number): LiveFief {
  const { wood, stone, iron, gold, food } = overview.resources
  return {
    overview,
    amounts: {
      wood: amountAfter(wood, elapsedSeconds),
      stone: amountAfter(stone, elapsedSeconds),
      iron: amountAfter(iron, elapsedSeconds),
      gold: amountAfter(gold, elapsedSeconds),
      food: amountAfter(food, elapsedSeconds),
    },
    slotRemainingSeconds: slotRemainingSecondsAt(overview, elapsedSeconds),
  }
}
