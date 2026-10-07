import { type ResourceKind, ResourceKindSchema } from '@mygame/contracts'
import type { LiveFief } from './liveFief'

export function fullStoreOf({ overview, amounts }: LiveFief): ResourceKind | undefined {
  return ResourceKindSchema.options.find(
    (resource) => amounts[resource] >= overview.resources[resource].capacity,
  )
}
