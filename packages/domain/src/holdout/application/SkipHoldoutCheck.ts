import type { DomainError } from '#DomainError'
import type { Band } from '#learning/curriculum/domain/Band'
import type { Clock } from '#platform/domain/Clock'
import type { PlayerId } from '#player/PlayerId'
import { ok, type Result } from '#Result'
import { resolveDueBandStart } from '../application/resolveDueBandStart'
import type { BandStartRepository } from '../domain/BandStartRepository'
import type { SkippedHoldoutCheck } from '../domain/HoldoutCheck'
import type { HoldoutCheckView } from '../domain/HoldoutCheckView'
import type { HoldoutCheckWeek } from '../domain/HoldoutCheckWeek'
import { type MutateHoldoutCheckDependencies, mutateHoldoutCheck } from './mutateHoldoutCheck'

export type SkipHoldoutCheckCommand = {
  readonly playerId: PlayerId
  readonly band: Band
  readonly week: HoldoutCheckWeek
}

type SkipPorts = {
  readonly bandStarts: BandStartRepository
  readonly clock: Clock
}

const skipHoldoutCheckIn = async (
  { playerId, band, week }: SkipHoldoutCheckCommand,
  { bandStarts, clock }: SkipPorts,
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

export type SkipHoldoutCheckDependencies = MutateHoldoutCheckDependencies

export class SkipHoldoutCheck {
  constructor(private readonly dependencies: SkipHoldoutCheckDependencies) {}

  async execute(
    command: SkipHoldoutCheckCommand,
  ): Promise<Result<ReadonlyArray<HoldoutCheckView>, DomainError>> {
    return mutateHoldoutCheck(
      command,
      (stores, { band, week }, at) =>
        skipHoldoutCheckIn(
          { playerId: command.playerId, band, week },
          { bandStarts: stores.bandStarts, clock: at },
        ),
      this.dependencies,
    )
  }
}
