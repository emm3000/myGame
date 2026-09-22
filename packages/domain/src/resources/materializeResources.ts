import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import type { ResourceStock, Resources } from './Resources'

export type MaterializedResources = {
  readonly resources: Resources
  readonly at: Instant
}

const accrueStock = (stock: ResourceStock, elapsedHours: number): ResourceStock => ({
  ...stock,
  amount: Math.floor(
    Math.min(stock.capacityUnits, stock.amount + stock.ratePerHour * elapsedHours),
  ),
})

export const materializeResources = (
  resources: Resources,
  storedAt: Instant,
  now: Instant,
): Result<MaterializedResources, DomainError> => {
  const elapsedHours = now.secondsSince(storedAt) / 3600
  if (elapsedHours < 0) {
    return err({ kind: 'InstantBeforeStored', storedAt, now })
  }

  const resourcesAccrued: Resources = {
    wood: accrueStock(resources.wood, elapsedHours),
    stone: accrueStock(resources.stone, elapsedHours),
    iron: accrueStock(resources.iron, elapsedHours),
    gold: accrueStock(resources.gold, elapsedHours),
    food: accrueStock(resources.food, elapsedHours),
  }

  return ok({ resources: resourcesAccrued, at: now })
}
