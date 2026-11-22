import type { DomainError } from '#DomainError'
import { ok, type Result } from '#Result'
import { Duration } from '#time/Duration'
import type { Instant } from '#time/Instant'
import type { BusyWorkSlot } from './BuildingWork'
import type { WaitingWork } from './WaitingList'

export const busySlotOf = (
  work: WaitingWork,
  startedAt: Instant,
): Result<BusyWorkSlot, DomainError> => {
  const duration = Duration.ofSeconds(work.durationSeconds)
  if (!duration.ok) {
    return duration
  }
  const { building, level, cost } = work
  return ok({
    kind: 'busy',
    building,
    level,
    cost,
    startedAt,
    finishesAt: startedAt.plus(duration.value),
  })
}
