import { Instant } from '../time/Instant'

export type Store = {
  readonly amount: number
  readonly fullSince: Instant | null
}

const MILLISECONDS_PER_HOUR = 3_600_000

export const storeAfterSegment = (
  store: Store,
  ratePerHour: number,
  capacity: number,
  from: Instant,
  to: Instant,
): Store => {
  if (store.amount >= capacity || ratePerHour === 0) {
    return store
  }
  const elapsed = to.epochMilliseconds - from.epochMilliseconds
  const grown = Math.floor(
    (store.amount * MILLISECONDS_PER_HOUR + ratePerHour * elapsed) / MILLISECONDS_PER_HOUR,
  )
  if (grown < capacity) {
    return { amount: Math.max(store.amount, grown), fullSince: null }
  }
  const crossing = Math.ceil(((capacity - store.amount) * MILLISECONDS_PER_HOUR) / ratePerHour)
  return {
    amount: capacity,
    fullSince: Instant.fromEpochMilliseconds(from.epochMilliseconds + crossing),
  }
}
