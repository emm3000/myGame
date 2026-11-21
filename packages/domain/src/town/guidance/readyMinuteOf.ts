import { Instant } from '#time/Instant'
import { storeAfterSegment } from '../resources/storeAfterSegment'

export interface ReadyStock {
  readonly amount: number
  readonly ratePerHour: number
  readonly capacity: number
}

export interface ResourceNeed {
  readonly stock: ReadyStock
  readonly cost: number
}

const MINUTES_PER_HOUR = 60
const MILLISECONDS_PER_MINUTE = 60_000

const isReachable = ({ stock, cost }: ResourceNeed): boolean =>
  stock.ratePerHour > 0 && cost <= stock.capacity

const minutesToGain = (stock: ReadyStock, target: number): number =>
  Math.ceil(((target - stock.amount) * MINUTES_PER_HOUR) / stock.ratePerHour)

const amountAfter = (stock: ReadyStock, readAt: Instant, minutes: number): number =>
  storeAfterSegment(
    { amount: stock.amount, fullSince: null },
    stock.ratePerHour,
    stock.capacity,
    readAt,
    Instant.fromEpochMilliseconds(readAt.epochMilliseconds + minutes * MILLISECONDS_PER_MINUTE),
  ).amount

function minutesAfter({ stock, cost }: ResourceNeed, readAt: Instant): number {
  const last = minutesToGain(stock, stock.capacity) + 1
  let minute = Math.max(1, minutesToGain(stock, cost) - 1)
  while (minute < last && amountAfter(stock, readAt, minute) < cost) {
    minute += 1
  }
  return minute
}

const roundedUpToMinute = (epochMilliseconds: number): Instant =>
  Instant.fromEpochMilliseconds(
    Math.ceil(epochMilliseconds / MILLISECONDS_PER_MINUTE) * MILLISECONDS_PER_MINUTE,
  )

export function readyMinuteOf(needs: ReadonlyArray<ResourceNeed>, readAt: Instant): Instant | null {
  const shortNeeds = needs.filter(({ stock, cost }) => stock.amount < cost)
  if (shortNeeds.length === 0 || !shortNeeds.every(isReachable)) {
    return null
  }
  const latest = Math.max(...shortNeeds.map((need) => minutesAfter(need, readAt)))
  return roundedUpToMinute(readAt.epochMilliseconds + latest * MILLISECONDS_PER_MINUTE)
}
