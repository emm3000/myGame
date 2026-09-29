import { type ResourceAmounts, ResourceKindSchema } from '@mygame/contracts'
import type { ResourceQuantity } from '../copy'

export function lootQuantitiesOf(loot: ResourceAmounts): ReadonlyArray<ResourceQuantity> {
  return ResourceKindSchema.options
    .filter((resource) => loot[resource] > 0)
    .map((resource) => ({ resource, amount: loot[resource] }))
}
