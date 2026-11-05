import {
  foundingArrivalHeading,
  foundingNewFiefHeading,
  foundingOutboundHeading,
  mapCampStrength,
  marchAttackHeading,
  marchCampHeading,
  marchLootHeading,
  marchPhaseHeadingsOutbound,
  marchPhaseLinesOutbound,
  marchReturnHeading,
  transportCargoHeading,
  transportOutboundHeading,
} from '@mygame/catalog'
import type { FiefOverview } from '@mygame/contracts'
import { formatDuration } from '../design-system/formatDuration'
import type { PreviewLine } from '../design-system/PreviewLines'
import { quantitiesOf } from '../resources/quantitiesOf'
import { quantitiesPhraseOf } from '../resources/quantitiesPhraseOf'
import { secondsBetween } from '../time/secondsBetween'
import { partyPhraseOf } from '../units/partyPhraseOf'

type SentMarch = NonNullable<FiefOverview['march']>

function returnLineOf(march: SentMarch, readAt: string): PreviewLine {
  return {
    heading: marchReturnHeading(),
    value: formatDuration(secondsBetween(readAt, march.returnsAt)),
    isNumeral: true,
  }
}

function lootLineOf(march: SentMarch): PreviewLine {
  return {
    heading: marchLootHeading(),
    value: quantitiesPhraseOf(quantitiesOf(march.loot)),
    isNumeral: false,
  }
}

function attackLinesOf(
  march: Extract<SentMarch, { readonly order: 'attack' }>,
  readAt: string,
): ReadonlyArray<PreviewLine> {
  const lines: ReadonlyArray<PreviewLine> = [
    {
      heading: marchAttackHeading(),
      value: marchPhaseLinesOutbound({
        party: partyPhraseOf(march.units),
        province: march.province,
        plot: march.plot,
      }),
      isNumeral: false,
    },
    {
      heading: marchCampHeading(),
      value: mapCampStrength({ tier: march.camp.tier, strength: march.camp.strength }),
      isNumeral: false,
    },
    returnLineOf(march, readAt),
  ]
  return quantitiesOf(march.loot).length === 0 ? lines : [...lines, lootLineOf(march)]
}

function foundingLinesOf(
  march: Extract<SentMarch, { readonly order: 'found' }>,
  readAt: string,
): ReadonlyArray<PreviewLine> {
  return [
    {
      heading: foundingOutboundHeading(),
      value: marchPhaseLinesOutbound({
        party: partyPhraseOf(march.units),
        province: march.province,
        plot: march.plot,
      }),
      isNumeral: false,
    },
    { heading: foundingNewFiefHeading(), value: march.name, isNumeral: false },
    {
      heading: foundingArrivalHeading(),
      value: formatDuration(secondsBetween(readAt, march.arrivesAt)),
      isNumeral: true,
    },
  ]
}

function transportLinesOf(
  march: Extract<SentMarch, { readonly order: 'transport' }>,
  readAt: string,
): ReadonlyArray<PreviewLine> {
  return [
    {
      heading: transportOutboundHeading(),
      value: marchPhaseLinesOutbound({
        party: partyPhraseOf(march.units),
        province: march.province,
        plot: march.plot,
      }),
      isNumeral: false,
    },
    {
      heading: transportCargoHeading(),
      value: quantitiesPhraseOf(quantitiesOf(march.cargo)),
      isNumeral: false,
    },
    {
      heading: foundingArrivalHeading(),
      value: formatDuration(secondsBetween(readAt, march.arrivesAt)),
      isNumeral: true,
    },
  ]
}

export function marchSentLinesOf(march: SentMarch, readAt: string): ReadonlyArray<PreviewLine> {
  if (march.order === 'attack') {
    return attackLinesOf(march, readAt)
  }
  if (march.order === 'found') {
    return foundingLinesOf(march, readAt)
  }
  if (march.order === 'transport') {
    return transportLinesOf(march, readAt)
  }
  return [
    {
      heading: marchPhaseHeadingsOutbound(),
      value: marchPhaseLinesOutbound({
        party: partyPhraseOf(march.units),
        province: march.province,
        plot: march.plot,
      }),
      isNumeral: false,
    },
    returnLineOf(march, readAt),
    lootLineOf(march),
  ]
}
