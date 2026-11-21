import type { DomainError } from '#DomainError'
import type { Band } from '#learning/curriculum/Band'
import type { PlayerId } from '#player/PlayerId'
import type { Clock } from '#ports/Clock'
import { ok, type Result } from '#Result'
import type { SkippedHoldoutCheck } from '../HoldoutCheck'
import type { HoldoutCheckWeek } from '../HoldoutCheckWeek'
import type { BandStartRepository } from '../ports/BandStartRepository'
import { resolveDueBandStart } from '../services/resolveDueBandStart'

export type SkipHoldoutCheckCommand = {
  readonly playerId: PlayerId
  readonly band: Band
  readonly week: HoldoutCheckWeek
}

export type SkipHoldoutCheckDependencies = {
  readonly bandStarts: BandStartRepository
  readonly clock: Clock
}

export const skipHoldoutCheck = async (
  { playerId, band, week }: SkipHoldoutCheckCommand,
  { bandStarts, clock }: SkipHoldoutCheckDependencies,
): Promise<Result<SkippedHoldoutCheck, DomainError>> => {
  const now = clock.now()
  const due = await resolveDueBandStart(playerId, band, week, bandStarts, now)
  if (!due.ok) {
    return due
  }
  const skipped: SkippedHoldoutCheck = { kind: 'skipped', week, skippedAt: now }
  const saved = await bandStarts.saveCheck(playerId, band, skipped)
  return saved.ok ? ok(skipped) : saved
}
