import type { ResourceAmounts } from '@mygame/contracts'
import type { ChromeCatalog } from '../copy/PlayerCopy'
import { conjunctionOf } from '../design-system/conjunctionOf'
import { amountLinesOf } from './amountLinesOf'

export function amountsLineOf(
  catalog: ChromeCatalog,
  amounts: ResourceAmounts,
): string | undefined {
  const quantities = amountLinesOf(catalog, amounts)
  return quantities.length === 0 ? undefined : conjunctionOf(catalog, quantities)
}
