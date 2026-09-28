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
  readonly studyRemainingSeconds: number
  readonly studyTotalSeconds: number
  readonly seasonRemainingSeconds: number
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

type TimedWork = FiefOverview['slot'] | FiefOverview['study']

function remainingSecondsOf(
  work: TimedWork,
  overview: FiefOverview,
  elapsedSeconds: number,
): number {
  return work.kind === 'idle' ? 0 : remainingSecondsAt(work.finishesAt, overview, elapsedSeconds)
}

function totalSecondsOf(work: TimedWork): number {
  return work.kind === 'idle'
    ? 0
    : (Date.parse(work.finishesAt) - Date.parse(work.startedAt)) / 1000
}

export function slotRemainingSecondsAt(overview: FiefOverview, elapsedSeconds: number): number {
  return remainingSecondsOf(overview.slot, overview, elapsedSeconds)
}

export function studyRemainingSecondsAt(overview: FiefOverview, elapsedSeconds: number): number {
  return remainingSecondsOf(overview.study, overview, elapsedSeconds)
}

export function seasonRemainingSecondsAt(overview: FiefOverview, elapsedSeconds: number): number {
  return overview.season === null
    ? 0
    : remainingSecondsAt(overview.season.endsAt, overview, elapsedSeconds)
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
    slotTotalSeconds: totalSecondsOf(overview.slot),
    studyRemainingSeconds: studyRemainingSecondsAt(overview, elapsedSeconds),
    studyTotalSeconds: totalSecondsOf(overview.study),
    seasonRemainingSeconds: seasonRemainingSecondsAt(overview, elapsedSeconds),
    waitingUpgrades: overview.queue.entries.map(({ building, targetLevel, finishesAt }) => ({
      building,
      targetLevel,
      remainingSeconds: remainingSecondsAt(finishesAt, overview, elapsedSeconds),
    })),
  }
}
