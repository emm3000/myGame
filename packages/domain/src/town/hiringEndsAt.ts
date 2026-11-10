import { Instant } from '../time/Instant'
import type { HiringOrder } from './HiringOrder'

const MILLISECONDS_PER_SECOND = 1_000

export const hiringEndsAt = (order: HiringOrder): Instant =>
  Instant.fromEpochMilliseconds(
    order.startedAt.epochMilliseconds +
      order.count * order.secondsPerHire * MILLISECONDS_PER_SECOND,
  )
