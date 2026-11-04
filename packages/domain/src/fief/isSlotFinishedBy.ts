import type { Instant } from '../time/Instant'
import type { BusySlot } from './BuildSlot'
import type { BusyStudySlot, LessonStudySlot } from './StudySlot'

export const isSlotFinishedBy = (
  slot: BusySlot | BusyStudySlot | LessonStudySlot,
  now: Instant,
): boolean => slot.finishesAt.epochMilliseconds <= now.epochMilliseconds
