import type { ResourceAmounts } from '@mygame/contracts'
import type { ChromeCatalog, PlayerCopy } from '../copy/PlayerCopy'
import type { Label } from '../design-system/Label'
import { amountsLineOf } from '../resources/amountsLineOf'

export function jobPayLineOf(
  copy: PlayerCopy,
  pay: ResourceAmounts,
  line: (catalog: ChromeCatalog, amounts: string) => string,
): Label | undefined {
  const label = copy.chrome((catalog) => {
    const amounts = amountsLineOf(catalog, pay)
    return amounts === undefined ? '' : line(catalog, amounts)
  })
  return label.text === '' ? undefined : label
}
