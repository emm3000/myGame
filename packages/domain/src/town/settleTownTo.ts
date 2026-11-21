import type { DomainError } from '../DomainError'
import { ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { finishBuildingWork } from './building/finishBuildingWork'
import { jobInstantsOf } from './jobs/jobInstantsOf'
import type { TownCatalog } from './ports/TownCatalog'
import { accrueTown } from './resources/accrueTown'
import { rebaseFullSince } from './resources/rebaseFullSince'
import type { ChangedTown, Town } from './Town'

const returnOf = (
  town: Town,
  returnsAt: Instant,
  catalog: TownCatalog,
): Result<ChangedTown, DomainError> => {
  const accrual = accrueTown(town, catalog, returnsAt)
  if (!accrual.ok) {
    return accrual
  }
  const returned = town.jobs.comeBack(accrual.value.stocks)
  const rebased = rebaseFullSince(accrual.value.fullSince, town.changedBy(returned.state), catalog)
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
  const arriving = before.value.town
  const arrived = arriving.jobs.arriveAtWaste()
  return ok({
    town: arriving.changedBy(arrived.state),
    events: [...before.value.events, ...arrived.events],
  })
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
