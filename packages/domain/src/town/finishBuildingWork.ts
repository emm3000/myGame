import type { DomainError } from '../DomainError'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'
import type { BusyWorkSlot } from './BuildingWork'
import { rebaseFullSince } from './rebaseFullSince'
import type { ChangedTown, Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { TownEvent } from './TownEvent'
import { townLabelOf } from './townLabelOf'

const finishedSlotOf = (town: Town, now: Instant): BusyWorkSlot | undefined => {
  const slot = town.workSlot
  return slot.kind === 'busy' && slot.finishesAt.epochMilliseconds <= now.epochMilliseconds
    ? slot
    : undefined
}

const eventsOfFinish = (
  finished: BusyWorkSlot,
  before: Town,
  after: Town,
  catalog: TownCatalog,
): Result<ReadonlyArray<TownEvent>, DomainError> => {
  const labelBefore = townLabelOf(before.buildingLevels, catalog)
  if (!labelBefore.ok) {
    return labelBefore
  }
  const labelAfter = townLabelOf(after.buildingLevels, catalog)
  if (!labelAfter.ok) {
    return labelAfter
  }
  const occurredAt = finished.finishesAt
  const workFinished: TownEvent = {
    kind: 'buildingWorkFinished',
    building: finished.building,
    level: finished.level,
    occurredAt,
  }
  const becameCity = labelBefore.value === 'town' && labelAfter.value === 'city'
  return ok(becameCity ? [workFinished, { kind: 'becameCity', occurredAt }] : [workFinished])
}

const finishWork = (
  town: Town,
  finished: BusyWorkSlot,
  catalog: TownCatalog,
): Result<ChangedTown, DomainError> => {
  const accrual = accrueTown(town, catalog, finished.finishesAt)
  if (!accrual.ok) {
    return accrual
  }
  const completed = town.completeWork(accrual.value.stocks)
  if (!completed.ok) {
    return completed
  }
  const rebased = rebaseFullSince(accrual.value.fullSince, completed.value, catalog)
  if (!rebased.ok) {
    return rebased
  }
  const events = eventsOfFinish(finished, town, rebased.value, catalog)
  if (!events.ok) {
    return events
  }
  return ok({ town: rebased.value, events: events.value })
}

export const finishBuildingWork = (
  town: Town,
  catalog: TownCatalog,
  now: Instant,
): Result<ChangedTown, DomainError> => {
  let current = town
  const events: Array<TownEvent> = []
  for (
    let finished = finishedSlotOf(current, now);
    finished;
    finished = finishedSlotOf(current, now)
  ) {
    const step = finishWork(current, finished, catalog)
    if (!step.ok) {
      return step
    }
    current = step.value.town
    events.push(...step.value.events)
  }
  return ok({ town: current, events })
}
