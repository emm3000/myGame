import { ResourceKindSchema } from '@mygame/contracts'
import { copy } from '../copy'
import type { CardCost } from '../design-system/CostList'
import type { LiveAmounts } from './liveFief'
import { type ResourceCost, shortfallOf } from './shortfallsOf'

export function resourceCostsOf(cost: ResourceCost, amounts: LiveAmounts): ReadonlyArray<CardCost> {
  return ResourceKindSchema.options
    .filter((kind) => cost[kind] > 0)
    .map((kind) => ({
      kind,
      amount: cost[kind],
      spokenName: copy.fief.costName(kind),
      shortMark: shortfallOf(cost[kind], amounts[kind]) > 0 ? copy.fief.shortMark : undefined,
    }))
}
