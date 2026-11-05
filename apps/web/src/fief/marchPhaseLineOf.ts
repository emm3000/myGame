import {
  foundingOutboundHeading,
  marchAttackHeading,
  marchAttackReturningHeading,
  marchPhaseHeadingsForaging,
  marchPhaseHeadingsOutbound,
  marchPhaseHeadingsReturning,
  marchPhaseLinesForaging,
  marchPhaseLinesOutbound,
  marchPhaseLinesReturning,
  transportOutboundHeading,
  transportReturningHeading,
} from '@mygame/catalog'
import type { PreviewLine } from '../design-system/PreviewLines'
import { partyPhraseOf } from '../units/partyPhraseOf'
import { isFoundingOnTheWay, type LiveFief, type LiveMarch } from './liveFief'

type AnsweredMarch = NonNullable<LiveFief['overview']['march']>

type MarchPhase = LiveMarch['phase']

interface PhasePlace {
  readonly party: string
  readonly province: number
  readonly plot: number
}

const phaseLines: Readonly<Record<MarchPhase, (place: PhasePlace) => string>> = {
  outbound: marchPhaseLinesOutbound,
  foraging: marchPhaseLinesForaging,
  returning: marchPhaseLinesReturning,
}

const phaseHeadings: Readonly<Record<MarchPhase, () => string>> = {
  outbound: marchPhaseHeadingsOutbound,
  foraging: marchPhaseHeadingsForaging,
  returning: marchPhaseHeadingsReturning,
}

export function marchPhaseLineOf(live: LiveMarch, answered: AnsweredMarch): PreviewLine {
  const value = phaseLines[live.phase]({
    party: partyPhraseOf(answered.units),
    province: answered.province,
    plot: answered.plot,
  })
  if (isFoundingOnTheWay(answered)) {
    return { heading: foundingOutboundHeading(), value, isNumeral: false }
  }
  if (answered.order === 'transport') {
    const heading =
      live.phase === 'outbound' ? transportOutboundHeading() : transportReturningHeading()
    return { heading, value, isNumeral: false }
  }
  if (answered.order !== 'attack' || answered.recalledAt !== null) {
    return { heading: phaseHeadings[live.phase](), value, isNumeral: false }
  }
  const heading = live.phase === 'outbound' ? marchAttackHeading() : marchAttackReturningHeading()
  return { heading, value, isNumeral: false }
}
