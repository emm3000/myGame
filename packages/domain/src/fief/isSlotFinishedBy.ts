import type { Instant } from '../time/Instant'
import type { BusySlot } from './BuildSlot'
import type { BusyStudySlot } from './StudySlot'

export const isSlotFinishedBy = (slot: BusySlot | BusyStudySlot, now: Instant): boolean =>
  slot.finishesAt.epochMilliseconds <= now.epochMilliseconds
