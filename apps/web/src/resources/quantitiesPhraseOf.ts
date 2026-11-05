import { namesQuantity } from '@mygame/catalog'
import { conjunctionOf } from '../design-system/conjunctionOf'
import { formatQuantity } from '../design-system/formatQuantity'
import type { ResourceQuantity } from './ResourceQuantity'
import { resourceNameOf } from './resourceNameOf'

export function quantitiesPhraseOf(quantities: ReadonlyArray<ResourceQuantity>): string {
  return conjunctionOf(
    quantities.map(({ amount, resource }) =>
      namesQuantity({ amount: formatQuantity(amount), resource: resourceNameOf(resource) }),
    ),
  )
}
