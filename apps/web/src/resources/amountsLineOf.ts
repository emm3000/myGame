import { type ResourceAmounts, ResourceKindSchema } from '@mygame/contracts'
import type { ChromeCatalog } from '../copy/PlayerCopy'
import { conjunctionOf } from '../design-system/conjunctionOf'
import { formatQuantity } from '../design-system/formatQuantity'
import { townResourceNameOf } from './townResourceNameOf'

export function amountsLineOf(
  catalog: ChromeCatalog,
  amounts: ResourceAmounts,
): string | undefined {
  const quantities = ResourceKindSchema.options
    .filter((resource) => amounts[resource] > 0)
    .map((resource) =>
      catalog.townAmount({
        amount: formatQuantity(amounts[resource]),
        resource: townResourceNameOf(catalog, resource),
      }),
    )
  return quantities.length === 0 ? undefined : conjunctionOf(quantities)
}
