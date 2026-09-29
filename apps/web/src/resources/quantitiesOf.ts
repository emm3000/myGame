import { type ResourceAmounts, ResourceKindSchema } from '@mygame/contracts'
import type { ResourceQuantity } from '../copy'

export function quantitiesOf(amounts: ResourceAmounts): ReadonlyArray<ResourceQuantity> {
  return ResourceKindSchema.options
    .filter((resource) => amounts[resource] > 0)
    .map((resource) => ({ resource, amount: amounts[resource] }))
}
