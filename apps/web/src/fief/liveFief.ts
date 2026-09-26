import type { BuildingKind, FiefOverview, ResourceKind } from '@mygame/contracts'

export type LiveAmounts = Readonly<Record<ResourceKind, number>>

export interface LiveWaitingUpgrade {
  readonly building: BuildingKind
  readonly targetLevel: number
  readonly remainingSeconds: number
}

export interface LiveFief {
  readonly overview: FiefOverview
  readonly amounts: LiveAmounts
  readonly slotRemainingSeconds: number
  readonly slotTotalSeconds: number
  readonly waitingUpgrades: ReadonlyArray<LiveWaitingUpgrade>
}

const secondsPerHour = 3600

const amountAfter = (
  { amount, ratePerHour, capacity }: FiefOverview['resources']['wood'],
  elapsedSeconds: number,
): number =>
  Math.max(amount, Math.min(capacity, amount + (ratePerHour * elapsedSeconds) / secondsPerHour))

const remainingSecondsAt = (
  finishesAt: string,
  overview: FiefOverview,
  elapsedSeconds: number,
): number => {
  const atReadSeconds = (Date.parse(finishesAt) - Date.parse(overview.readAt)) / 1000
  return Math.max(0, atReadSeconds - elapsedSeconds)
}

export function slotRemainingSecondsAt(overview: FiefOverview, elapsedSeconds: number): number {
  if (overview.slot.kind === 'idle') {
    return 0
  }
  return remainingSecondsAt(overview.slot.finishesAt, overview, elapsedSeconds)
}

function slotTotalSecondsOf(overview: FiefOverview): number {
  if (overview.slot.kind === 'idle') {
    return 0
  }
  return (Date.parse(overview.slot.finishesAt) - Date.parse(overview.slot.startedAt)) / 1000
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
    slotTotalSeconds: slotTotalSecondsOf(overview),
    waitingUpgrades: overview.queue.entries.map(({ building, targetLevel, finishesAt }) => ({
      building,
      targetLevel,
      remainingSeconds: remainingSecondsAt(finishesAt, overview, elapsedSeconds),
    })),
  }
}
