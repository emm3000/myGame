import type { FiefOverview } from '@mygame/contracts'
import { copy } from '../copy'
import { formatDuration } from '../design-system/formatDuration'
import type { PreviewLine } from '../design-system/PreviewLines'
import { lootQuantitiesOf } from './lootQuantitiesOf'

type SentMarch = NonNullable<FiefOverview['march']>

const secondsBetween = (from: string, to: string): number =>
  (Date.parse(to) - Date.parse(from)) / 1000

export function marchSentLinesOf(march: SentMarch, readAt: string): ReadonlyArray<PreviewLine> {
  return [
    {
      heading: copy.march.outboundHeading,
      value: copy.march.outbound(march.infantry, march.province, march.plot),
      isNumeral: false,
    },
    {
      heading: copy.march.returnHeading,
      value: formatDuration(secondsBetween(readAt, march.returnsAt)),
      isNumeral: true,
    },
    {
      heading: copy.march.lootHeading,
      value: copy.march.loot(lootQuantitiesOf(march.loot)),
      isNumeral: false,
    },
  ]
}
