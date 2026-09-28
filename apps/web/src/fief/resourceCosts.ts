import { type ResourceKind, ResourceKindSchema } from '@mygame/contracts'
import type { CardCost } from '../design-system/CostList'
import type { LiveAmounts } from './liveFief'

export type ResourceCost = Readonly<Record<ResourceKind, number>>

interface Shortfall {
  readonly amount: number
  readonly resource: ResourceKind
}

const shortfallOf = (cost: number, amount: number): number => Math.max(0, cost - Math.floor(amount))

export function resourceCostsOf(cost: ResourceCost, amounts: LiveAmounts): ReadonlyArray<CardCost> {
  return ResourceKindSchema.options
    .filter((kind) => cost[kind] > 0)
    .map((kind) => ({
      kind,
      amount: cost[kind],
      isShort: shortfallOf(cost[kind], amounts[kind]) > 0,
    }))
}

export function shortfallsOf(cost: ResourceCost, amounts: LiveAmounts): ReadonlyArray<Shortfall> {
  return ResourceKindSchema.options
    .map((resource) => ({ resource, amount: shortfallOf(cost[resource], amounts[resource]) }))
    .filter(({ amount }) => amount > 0)
}
