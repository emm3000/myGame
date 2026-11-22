import type { Instant } from '#time/Instant'
import type { TownSettings } from '../../domain/TownSettings'
import type { SchoolLesson } from './SchoolLesson'
import type { SchoolLevel } from './SchoolLevel'
import { studyPercentAt } from './studyPercentAt'

export const lessonDurationSecondsAt = (
  { durationSeconds }: Pick<SchoolLesson, 'durationSeconds'>,
  { lessonPercent }: Pick<SchoolLevel, 'lessonPercent'>,
  at: Instant,
  settings: TownSettings,
): number => Math.ceil((durationSeconds * lessonPercent * studyPercentAt(at, settings)) / 10_000)
