import type { DomainError } from '../DomainError'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'
import { finishBuildingWork } from './finishBuildingWork'
import { jobInstantsOf } from './jobInstantsOf'
import { rebaseFullSince } from './rebaseFullSince'
import type { ChangedTown, Town } from './Town'
import type { TownCatalog } from './TownCatalog'

const returnOf = (
  town: Town,
  returnsAt: Instant,
  catalog: TownCatalog,
): Result<ChangedTown, DomainError> => {
  const accrual = accrueTown(town, catalog, returnsAt)
  if (!accrual.ok) {
    return accrual
  }
  const returned = town.returnJob(accrual.value.stocks)
  const rebased = rebaseFullSince(accrual.value.fullSince, returned.town, catalog)
  if (!rebased.ok) {
    return rebased
  }
  return ok({ town: rebased.value, events: returned.events })
}

const returnsByOf = (town: Town, at: Instant): Instant | undefined => {
  const slot = town.jobSlot
  if (slot.kind === 'idle') {
    return undefined
  }
  const { returnsAt } = jobInstantsOf(slot)
  return returnsAt.epochMilliseconds <= at.epochMilliseconds ? returnsAt : undefined
}

const arrivesByOf = (town: Town, at: Instant): Instant | undefined => {
  const slot = town.jobSlot
  if (
    slot.kind === 'idle' ||
    slot.cleanUp === undefined ||
    slot.cleanUp.hasArrived ||
    slot.calledBackAt !== undefined
  ) {
    return undefined
  }
  const { arrivesAt } = jobInstantsOf(slot)
  return arrivesAt.epochMilliseconds <= at.epochMilliseconds ? arrivesAt : undefined
}

const settleArrivalTo = (
  town: Town,
  catalog: TownCatalog,
  at: Instant,
): Result<ChangedTown, DomainError> => {
  const arrivesAt = arrivesByOf(town, at)
  if (arrivesAt === undefined) {
    return ok({ town, events: [] })
  }
  const before = finishBuildingWork(town, catalog, arrivesAt)
  if (!before.ok) {
    return before
  }
  const arrived = before.value.town.arriveAtWaste()
  return ok({ town: arrived.town, events: [...before.value.events, ...arrived.events] })
}

const settleReturnTo = (
  town: Town,
  catalog: TownCatalog,
  at: Instant,
): Result<ChangedTown, DomainError> => {
  const returnsAt = returnsByOf(town, at)
  if (returnsAt === undefined) {
    return finishBuildingWork(town, catalog, at)
  }
  const before = finishBuildingWork(town, catalog, returnsAt)
  if (!before.ok) {
    return before
  }
  const returned = returnOf(before.value.town, returnsAt, catalog)
  if (!returned.ok) {
    return returned
  }
  const after = finishBuildingWork(returned.value.town, catalog, at)
  if (!after.ok) {
    return after
  }
  return ok({
    town: after.value.town,
    events: [...before.value.events, ...returned.value.events, ...after.value.events],
  })
}

export const settleTownTo = (
  town: Town,
  catalog: TownCatalog,
  at: Instant,
): Result<ChangedTown, DomainError> => {
  const arrived = settleArrivalTo(town, catalog, at)
  if (!arrived.ok) {
    return arrived
  }
  const returned = settleReturnTo(arrived.value.town, catalog, at)
  if (!returned.ok) {
    return returned
  }
  return ok({
    town: returned.value.town,
    events: [...arrived.value.events, ...returned.value.events],
  })
}
