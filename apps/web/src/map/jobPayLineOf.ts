import type { ResourceAmounts } from '@mygame/contracts'
import type { ChromeCatalog, PlayerCopy } from '../copy/PlayerCopy'
import { conjunctionOf } from '../design-system/conjunctionOf'
import type { Label } from '../design-system/Label'
import { amountLinesOf } from '../resources/amountLinesOf'
import { paidResourcesOf } from '../resources/paidResourcesOf'

export function jobPayLineOf(
  copy: PlayerCopy,
  pay: ResourceAmounts,
  line: (catalog: ChromeCatalog, amounts: string) => string,
): Label | undefined {
  return paidResourcesOf(pay).length === 0
    ? undefined
    : copy.chrome((catalog) => line(catalog, conjunctionOf(catalog, amountLinesOf(catalog, pay))))
}
