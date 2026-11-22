import type { Instant } from '#time/Instant'
import { laterOf } from '#time/laterOf'

export const readInstantOf = (now: Instant, storedAt: Instant | undefined): Instant =>
  storedAt === undefined ? now : laterOf(now, storedAt)
