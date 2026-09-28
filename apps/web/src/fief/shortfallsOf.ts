import { type ResourceKind, ResourceKindSchema } from '@mygame/contracts'
import type { LiveAmounts } from './liveFief'

export type ResourceCost = Readonly<Record<ResourceKind, number>>

export const shortfallOf = (cost: number, amount: number): number =>
  Math.max(0, cost - Math.floor(amount))

interface Shortfall {
  readonly amount: number
  readonly resource: ResourceKind
}

export function shortfallsOf(cost: ResourceCost, amounts: LiveAmounts): ReadonlyArray<Shortfall> {
  return ResourceKindSchema.options
    .map((resource) => ({ resource, amount: shortfallOf(cost[resource], amounts[resource]) }))
    .filter(({ amount }) => amount > 0)
}
