import { type ResourceAmounts, ResourceKindSchema } from '@mygame/contracts'
import type { PlayerCopy } from '../copy/PlayerCopy'
import type { CardCost } from '../design-system/CostList'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import type { LiveStocks } from './liveTown'

export const cardCostsOf = (
  copy: PlayerCopy,
  cost: ResourceAmounts,
  stocks: LiveStocks,
): ReadonlyArray<CardCost> =>
  ResourceKindSchema.options
    .filter((resource) => cost[resource] > 0)
    .map((resource) => ({
      kind: resource,
      amount: cost[resource],
      spokenName: copy.chrome((catalog) =>
        catalog.townCostName({ resource: townResourceNameOf(catalog, resource) }),
      ),
      shortMark:
        cost[resource] > Math.floor(stocks[resource])
          ? copy.chrome((catalog) => catalog.townShortMark())
          : undefined,
    }))
