import { townCostName, townShortMark } from '@mygame/catalog'
import { type ResourceAmounts, ResourceKindSchema } from '@mygame/contracts'
import type { CardCost } from '../design-system/CostList'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import type { LiveStocks } from './liveTown'

export const cardCostsOf = (cost: ResourceAmounts, stocks: LiveStocks): ReadonlyArray<CardCost> =>
  ResourceKindSchema.options
    .filter((resource) => cost[resource] > 0)
    .map((resource) => ({
      kind: resource,
      amount: cost[resource],
      spokenName: townCostName({ resource: townResourceNameOf(resource) }),
      shortMark: cost[resource] > Math.floor(stocks[resource]) ? townShortMark() : undefined,
    }))
