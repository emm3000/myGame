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

export const settleTownTo = (
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
