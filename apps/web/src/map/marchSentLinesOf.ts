import type { FiefOverview } from '@mygame/contracts'
import { copy } from '../copy'
import { formatDuration } from '../design-system/formatDuration'
import type { PreviewLine } from '../design-system/PreviewLines'
import { quantitiesOf } from '../resources/quantitiesOf'
import { secondsBetween } from '../time/secondsBetween'

type SentMarch = NonNullable<FiefOverview['march']>

function returnLineOf(march: SentMarch, readAt: string): PreviewLine {
  return {
    heading: copy.march.returnHeading,
    value: formatDuration(secondsBetween(readAt, march.returnsAt)),
    isNumeral: true,
  }
}

function lootLineOf(march: SentMarch): PreviewLine {
  return {
    heading: copy.march.lootHeading,
    value: copy.march.loot(quantitiesOf(march.loot)),
    isNumeral: false,
  }
}

function attackLinesOf(
  march: Extract<SentMarch, { readonly order: 'attack' }>,
  readAt: string,
): ReadonlyArray<PreviewLine> {
  const lines: ReadonlyArray<PreviewLine> = [
    {
      heading: copy.march.attackHeading,
      value: copy.march.phaseLines.outbound(march.units.infantry, march.province, march.plot),
      isNumeral: false,
    },
    {
      heading: copy.march.campHeading,
      value: copy.map.campStrength(march.camp.tier, march.camp.strength),
      isNumeral: false,
    },
    returnLineOf(march, readAt),
  ]
  return quantitiesOf(march.loot).length === 0 ? lines : [...lines, lootLineOf(march)]
}

export function marchSentLinesOf(march: SentMarch, readAt: string): ReadonlyArray<PreviewLine> {
  if (march.order === 'attack') {
    return attackLinesOf(march, readAt)
  }
  return [
    {
      heading: copy.march.phaseHeadings.outbound,
      value: copy.march.phaseLines.outbound(march.units.infantry, march.province, march.plot),
      isNumeral: false,
    },
    returnLineOf(march, readAt),
    lootLineOf(march),
  ]
}
