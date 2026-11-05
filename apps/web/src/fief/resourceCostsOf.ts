import { fiefCostName, fiefShortMark } from '@mygame/catalog'
import { ResourceKindSchema } from '@mygame/contracts'
import type { CardCost } from '../design-system/CostList'
import { resourceNameOf } from '../resources/resourceNameOf'
import type { LiveAmounts } from './liveFief'
import { type ResourceCost, shortfallOf } from './shortfallsOf'

export function resourceCostsOf(cost: ResourceCost, amounts: LiveAmounts): ReadonlyArray<CardCost> {
  return ResourceKindSchema.options
    .filter((kind) => cost[kind] > 0)
    .map((kind) => ({
      kind,
      amount: cost[kind],
      spokenName: fiefCostName({ resource: resourceNameOf(kind) }),
      shortMark: shortfallOf(cost[kind], amounts[kind]) > 0 ? fiefShortMark() : undefined,
    }))
}
