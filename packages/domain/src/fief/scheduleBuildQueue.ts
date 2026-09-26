import type { DomainError } from '../DomainError'
import type { BuildingKind } from '../ports/BuildingCatalog'
import { ok, type Result } from '../Result'
import { Duration } from '../time/Duration'
import type { Instant } from '../time/Instant'
import type { BuildQueue } from './BuildQueue'
import type { BuildSlot } from './BuildSlot'

export type ScheduledUpgrade = {
  readonly building: BuildingKind
  readonly targetLevel: number
  readonly startsAt: Instant
  readonly finishesAt: Instant
}

export const scheduleBuildQueue = (
  slot: BuildSlot,
  buildQueue: BuildQueue,
): Result<ReadonlyArray<ScheduledUpgrade>, DomainError> => {
  if (slot.kind === 'idle') {
    return ok([])
  }
  const scheduled: Array<ScheduledUpgrade> = []
  let startsAt = slot.finishesAt
  for (const { building, targetLevel, durationSeconds } of buildQueue) {
    const duration = Duration.ofSeconds(durationSeconds)
    if (!duration.ok) {
      return duration
    }
    const finishesAt = startsAt.plus(duration.value)
    scheduled.push({ building, targetLevel, startsAt, finishesAt })
    startsAt = finishesAt
  }
  return ok(scheduled)
}
