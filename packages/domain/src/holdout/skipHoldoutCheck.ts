import type { DomainError } from '../DomainError'
import type { Band } from '../learning/BandStart'
import type { PlayerId } from '../player/PlayerId'
import type { BandStartRepository } from '../ports/BandStartRepository'
import type { Clock } from '../ports/Clock'
import { ok, type Result } from '../Result'
import { dueBandStartOf } from './dueBandStartOf'
import type { HoldoutCheckWeek, SkippedHoldoutCheck } from './HoldoutCheck'

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
  const due = await dueBandStartOf(playerId, band, week, bandStarts, now)
  if (!due.ok) {
    return due
  }
  const skipped: SkippedHoldoutCheck = { kind: 'skipped', week, skippedAt: now }
  const saved = await bandStarts.saveCheck(playerId, band, skipped)
  return saved.ok ? ok(skipped) : saved
}
