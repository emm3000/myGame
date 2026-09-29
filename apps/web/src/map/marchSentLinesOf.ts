import type { FiefOverview } from '@mygame/contracts'
import { copy } from '../copy'
import { formatDuration } from '../design-system/formatDuration'
import type { PreviewLine } from '../design-system/PreviewLines'
import { quantitiesOf } from '../resources/quantitiesOf'
import { secondsBetween } from '../time/secondsBetween'

type SentMarch = NonNullable<FiefOverview['march']>

export function marchSentLinesOf(march: SentMarch, readAt: string): ReadonlyArray<PreviewLine> {
  return [
    {
      heading: copy.march.phaseHeadings.outbound,
      value: copy.march.phaseLines.outbound(march.infantry, march.province, march.plot),
      isNumeral: false,
    },
    {
      heading: copy.march.returnHeading,
      value: formatDuration(secondsBetween(readAt, march.returnsAt)),
      isNumeral: true,
    },
    {
      heading: copy.march.lootHeading,
      value: copy.march.loot(quantitiesOf(march.loot)),
      isNumeral: false,
    },
  ]
}
