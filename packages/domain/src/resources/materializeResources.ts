import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { Resource, Resources } from './Resources'

export type MaterializedResources = {
  readonly resources: Resources
  readonly at: Instant
}

const MILLISECONDS_PER_HOUR = 3_600_000

const accrue = (resource: Resource, elapsedMilliseconds: number): Resource => {
  const accruedAmount = Math.floor(
    (resource.amount * MILLISECONDS_PER_HOUR + resource.ratePerHour * elapsedMilliseconds) /
      MILLISECONDS_PER_HOUR,
  )
  return resource.withAccruedAmount(
    Math.max(resource.amount, Math.min(resource.capacityUnits, accruedAmount)),
  )
}

export const materializeResources = (
  resources: Resources,
  storedAt: Instant,
  now: Instant,
): Result<MaterializedResources, DomainError> => {
  const elapsedMilliseconds = now.epochMilliseconds - storedAt.epochMilliseconds
  if (elapsedMilliseconds < 0) {
    return err({ kind: 'InstantBeforeStored', storedAt, now })
  }

  const resourcesAccrued: Resources = {
    wood: accrue(resources.wood, elapsedMilliseconds),
    stone: accrue(resources.stone, elapsedMilliseconds),
    iron: accrue(resources.iron, elapsedMilliseconds),
    gold: accrue(resources.gold, elapsedMilliseconds),
    food: accrue(resources.food, elapsedMilliseconds),
  }

  return ok({ resources: resourcesAccrued, at: now })
}
