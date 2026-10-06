import { copy } from '../copy'
import type { PreviewLine } from '../design-system/PreviewLines'
import { isFoundingOnTheWay, type LiveFief, type LiveMarch } from './liveFief'

const { march, founding, transport } = copy

type AnsweredMarch = NonNullable<LiveFief['overview']['march']>

export function marchPhaseLineOf(live: LiveMarch, answered: AnsweredMarch): PreviewLine {
  const value = march.phaseLines[live.phase](answered.units, answered.province, answered.plot)
  if (isFoundingOnTheWay(answered)) {
    return { heading: founding.outboundHeading, value, isNumeral: false }
  }
  if (answered.order === 'transport') {
    const heading =
      live.phase === 'outbound' ? transport.outboundHeading : transport.returningHeading
    return { heading, value, isNumeral: false }
  }
  if (answered.order !== 'attack' || answered.recalledAt !== null) {
    return { heading: march.phaseHeadings[live.phase], value, isNumeral: false }
  }
  const heading = live.phase === 'outbound' ? march.attackHeading : march.attackReturningHeading
  return { heading, value, isNumeral: false }
}
