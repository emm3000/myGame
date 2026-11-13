import type { Instant } from '../time/Instant'
import type { BusyLessonSlot } from './LessonSlot'

export const isLessonFinishedBy = (
  { finishesAt }: Pick<BusyLessonSlot, 'finishesAt'>,
  now: Instant,
): boolean => finishesAt.epochMilliseconds <= now.epochMilliseconds
