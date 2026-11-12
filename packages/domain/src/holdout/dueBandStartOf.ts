import type { DomainError } from '../DomainError'
import type { Band, BandStart } from '../learning/BandStart'
import type { PlayerId } from '../player/PlayerId'
import type { BandStartRepository } from '../ports/BandStartRepository'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { HoldoutCheckWeek } from './HoldoutCheck'
import { isHoldoutCheckDue } from './holdoutCheckWeeks'

export const dueBandStartOf = async (
  playerId: PlayerId,
  band: Band,
  week: HoldoutCheckWeek,
  bandStarts: Pick<BandStartRepository, 'bandStartsOf'>,
  now: Instant,
): Promise<Result<BandStart, DomainError>> => {
  const starts = await bandStarts.bandStartsOf(playerId)
  if (!starts.ok) {
    return starts
  }
  const start = starts.value.find((candidate) => candidate.band === band)
  if (start === undefined || !isHoldoutCheckDue(start, week, now)) {
    return err({ kind: 'HoldoutCheckNotDue', band, week })
  }
  return ok(start)
}
