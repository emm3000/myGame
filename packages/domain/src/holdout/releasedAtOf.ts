import type { BandStart } from '../learning/BandStart'
import type { Instant } from '../time/Instant'
import { checkOfWeek } from './checkOfWeek'
import { RELEASING_WEEK } from './holdoutCheckWeeks'

export const releasedAtOf = (start: BandStart): Instant | undefined => {
  const releasing = checkOfWeek(start, RELEASING_WEEK)
  if (releasing === undefined) {
    return undefined
  }
  switch (releasing.kind) {
    case 'begun':
      return undefined
    case 'taken':
      return releasing.takenAt
    case 'skipped':
      return releasing.skippedAt
  }
}
