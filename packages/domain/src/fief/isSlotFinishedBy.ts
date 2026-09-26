import type { Instant } from '../time/Instant'
import type { BusySlot } from './BuildSlot'

export const isSlotFinishedBy = (slot: BusySlot, now: Instant): boolean =>
  slot.finishesAt.epochMilliseconds <= now.epochMilliseconds
