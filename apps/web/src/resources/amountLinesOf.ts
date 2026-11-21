import type { ResourceAmounts } from '@mygame/contracts'
import type { ChromeCatalog } from '../copy/PlayerCopy'
import { formatQuantity } from '../design-system/formatQuantity'
import { paidResourcesOf } from './paidResourcesOf'
import { townResourceNameOf } from './townResourceNameOf'

export function amountLinesOf(
  catalog: ChromeCatalog,
  amounts: ResourceAmounts,
): ReadonlyArray<string> {
  return paidResourcesOf(amounts).map((resource) =>
    catalog.townAmount({
      amount: formatQuantity(amounts[resource]),
      resource: townResourceNameOf(catalog, resource),
    }),
  )
}
