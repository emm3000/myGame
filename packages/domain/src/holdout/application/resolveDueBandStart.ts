import type { DomainError } from '#DomainError'
import type { Band } from '#learning/curriculum/Band'
import type { PlayerId } from '#player/PlayerId'
import { err, ok, type Result } from '#Result'
import type { Instant } from '#time/Instant'
import type { BandStart } from '../domain/BandStart'
import type { BandStartRepository } from '../domain/BandStartRepository'
import type { HoldoutCheckWeek } from '../domain/HoldoutCheckWeek'
import { isHoldoutCheckDue } from '../domain/holdoutCheckWeeks'

export const resolveDueBandStart = async (
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
