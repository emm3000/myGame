import { townAmount } from '@mygame/catalog'
import { type ResourceAmounts, ResourceKindSchema } from '@mygame/contracts'
import { conjunctionOf } from '../design-system/conjunctionOf'
import { formatQuantity } from '../design-system/formatQuantity'
import { townResourceNameOf } from './townResourceNameOf'

export function amountsLineOf(amounts: ResourceAmounts): string | undefined {
  const quantities = ResourceKindSchema.options
    .filter((resource) => amounts[resource] > 0)
    .map((resource) =>
      townAmount({
        amount: formatQuantity(amounts[resource]),
        resource: townResourceNameOf(resource),
      }),
    )
  return quantities.length === 0 ? undefined : conjunctionOf(quantities)
}
