import { seasonAt } from '../season/seasonAt'
import type { Instant } from '../time/Instant'
import type { StudyPercents } from './StudyPercents'
import type { TownSettings } from './TownSettings'

const UNCHANGED_PERCENT = 100

export const studyPercentAt = (
  instant: Instant,
  settings: TownSettings,
  studyPercents: StudyPercents,
): number => {
  const season = seasonAt(instant, settings)
  return season === undefined ? UNCHANGED_PERCENT : studyPercents[season.kind]
}
