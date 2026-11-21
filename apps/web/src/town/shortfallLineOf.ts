import { type ResourceAmounts, type ResourceKind, ResourceKindSchema } from '@mygame/contracts'
import type { ChromeCatalog } from '../copy/PlayerCopy'
import { conjunctionOf } from '../design-system/conjunctionOf'
import { formatQuantity } from '../design-system/formatQuantity'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import type { LiveStocks } from './liveTown'

export interface Shortfall {
  readonly resource: ResourceKind
  readonly amount: number
}

const shortfallsBy = (amountOf: (resource: ResourceKind) => number): ReadonlyArray<Shortfall> =>
  ResourceKindSchema.options
    .map((resource) => ({ resource, amount: amountOf(resource) }))
    .filter(({ amount }) => amount > 0)

export const shortfallsOf = (cost: ResourceAmounts, stocks: LiveStocks): ReadonlyArray<Shortfall> =>
  shortfallsBy((resource) => Math.max(0, cost[resource] - Math.floor(stocks[resource])))

export const missingOf = (missing: ResourceAmounts): ReadonlyArray<Shortfall> =>
  shortfallsBy((resource) => missing[resource])

export function shortfallLineOf(
  catalog: ChromeCatalog,
  shortfalls: ReadonlyArray<Shortfall>,
): string {
  return catalog.townShortfall({
    missing: conjunctionOf(
      catalog,
      shortfalls.map(({ resource, amount }) =>
        catalog.townAmount({
          amount: formatQuantity(amount),
          resource: townResourceNameOf(catalog, resource),
        }),
      ),
    ),
  })
}
