import type { BuildingKind, ResourceKind, TownOverview } from '@mygame/contracts/town'

export type LiveStocks = Readonly<Record<ResourceKind, number>>

export interface LiveWork {
  readonly building: BuildingKind
  readonly level: number
  readonly remainingSeconds: number
}

export interface LiveTown {
  readonly overview: TownOverview
  readonly at: Date
  readonly stocks: LiveStocks
  readonly slot: (LiveWork & { readonly totalSeconds: number }) | null
  readonly waitingList: ReadonlyArray<LiveWork>
}

const secondsPerHour = 3600
const secondsPerMinute = 60

const wholeMinutesOf = (elapsedSeconds: number): number =>
  Math.floor(elapsedSeconds / secondsPerMinute) * secondsPerMinute

export const stockAfter = (
  { amount, ratePerHour, capacity }: TownOverview['stocks']['money'],
  elapsedSeconds: number,
): number =>
  Math.max(amount, Math.min(capacity, amount + (ratePerHour * elapsedSeconds) / secondsPerHour))

export const secondsUntil = (
  instant: string,
  overview: TownOverview,
  elapsedSeconds: number,
): number =>
  Math.max(0, (Date.parse(instant) - Date.parse(overview.readAt)) / 1000 - elapsedSeconds)

const stocksAfter = (overview: TownOverview, elapsedSeconds: number): LiveStocks => ({
  money: stockAfter(overview.stocks.money, elapsedSeconds),
  food: stockAfter(overview.stocks.food, elapsedSeconds),
  power: stockAfter(overview.stocks.power, elapsedSeconds),
  material: stockAfter(overview.stocks.material, elapsedSeconds),
})

const slotAt = (overview: TownOverview, elapsedSeconds: number): LiveTown['slot'] => {
  const { slot } = overview.work
  if (slot === null) {
    return null
  }
  return {
    building: slot.building,
    level: slot.level,
    remainingSeconds: secondsUntil(slot.finishesAt, overview, elapsedSeconds),
    totalSeconds: (Date.parse(slot.finishesAt) - Date.parse(slot.startsAt)) / 1000,
  }
}

export function liveTownAt(overview: TownOverview, elapsedSeconds: number): LiveTown {
  return {
    overview,
    at: new Date(Date.parse(overview.readAt) + elapsedSeconds * 1000),
    stocks: stocksAfter(overview, wholeMinutesOf(elapsedSeconds)),
    slot: slotAt(overview, elapsedSeconds),
    waitingList: overview.work.waitingList.map(({ building, level, finishesAt }) => ({
      building,
      level,
      remainingSeconds: secondsUntil(finishesAt, overview, elapsedSeconds),
    })),
  }
}
