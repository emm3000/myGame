import type { DomainError } from '#DomainError'
import { err, ok, type Result } from '#Result'
import { resourceKinds } from './resourceKinds'
import { type Stocks, stocksOf } from './Stocks'

export const chargedStocks = (stocks: Stocks, cost: Stocks): Result<Stocks, DomainError> => {
  const missing = stocksOf((resource) => Math.max(0, cost[resource] - stocks[resource]))
  if (resourceKinds.some((resource) => missing[resource] > 0)) {
    return err({ kind: 'NotEnoughResources', missing })
  }
  return ok(stocksOf((resource) => stocks[resource] - cost[resource]))
}
