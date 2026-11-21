import { es, townCostName, townShortMark } from '@mygame/catalog'
import { type ResourceAmounts, ResourceKindSchema } from '@mygame/contracts'
import type { CardCost } from '../design-system/CostList'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import type { LiveStocks } from './liveTown'

export const cardCostsOf = (cost: ResourceAmounts, stocks: LiveStocks): ReadonlyArray<CardCost> =>
  ResourceKindSchema.options
    .filter((resource) => cost[resource] > 0)
    .map((resource) => ({
      kind: resource,
      amount: cost[resource],
      spokenName: lineLabelOf(townCostName({ resource: townResourceNameOf(es, resource) }), 'es'),
      shortMark:
        cost[resource] > Math.floor(stocks[resource])
          ? lineLabelOf(townShortMark(), 'es')
          : undefined,
    }))
