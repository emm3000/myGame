import { type ResourceAmounts, type ResourceKind, ResourceKindSchema } from '@mygame/contracts'

export function paidResourcesOf(amounts: ResourceAmounts): ReadonlyArray<ResourceKind> {
  return ResourceKindSchema.options.filter((resource) => amounts[resource] > 0)
}
