import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { ResourceKind } from './ResourceKind'
import { resourceKinds } from './resourceKinds'

export type Stocks = Readonly<Record<ResourceKind, number>>

export const stocksOf = (amountOf: (resource: ResourceKind) => number): Stocks => ({
  money: amountOf('money'),
  food: amountOf('food'),
  power: amountOf('power'),
  material: amountOf('material'),
})

export const creditedStocks = (stocks: Stocks, amounts: Stocks): Stocks =>
  stocksOf((resource) => stocks[resource] + amounts[resource])

export const chargedStocks = (stocks: Stocks, cost: Stocks): Result<Stocks, DomainError> => {
  const missing = stocksOf((resource) => Math.max(0, cost[resource] - stocks[resource]))
  if (resourceKinds.some((resource) => missing[resource] > 0)) {
    return err({ kind: 'NotEnoughResources', missing })
  }
  return ok(stocksOf((resource) => stocks[resource] - cost[resource]))
}
