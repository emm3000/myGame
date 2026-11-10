import { townAmount, townShortfall } from '@mygame/catalog'
import { type ResourceAmounts, type ResourceKind, ResourceKindSchema } from '@mygame/contracts'
import { conjunctionOf } from '../design-system/conjunctionOf'
import { formatQuantity } from '../design-system/formatQuantity'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import type { LiveStocks } from './liveTown'

interface Shortfall {
  readonly resource: ResourceKind
  readonly amount: number
}

const shortfallsOf = (cost: ResourceAmounts, stocks: LiveStocks): ReadonlyArray<Shortfall> =>
  ResourceKindSchema.options
    .map((resource) => ({
      resource,
      amount: Math.max(0, cost[resource] - Math.floor(stocks[resource])),
    }))
    .filter(({ amount }) => amount > 0)

export function shortfallLineOf(cost: ResourceAmounts, stocks: LiveStocks): string | undefined {
  const shortfalls = shortfallsOf(cost, stocks)
  if (shortfalls.length === 0) {
    return undefined
  }
  return townShortfall({
    missing: conjunctionOf(
      shortfalls.map(({ resource, amount }) =>
        townAmount({ amount: formatQuantity(amount), resource: townResourceNameOf(resource) }),
      ),
    ),
  })
}
