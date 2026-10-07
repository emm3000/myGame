import type { FiefOverview, ResourceAmounts, Terrain } from '@mygame/contracts'
import { copy } from '../copy'
import type { MarchActionState } from '../design-system/CardAction'
import { campArtOf } from '../design-system/campArtOf'
import { formatDuration } from '../design-system/formatDuration'
import type { PreviewLine } from '../design-system/PreviewLines'
import { quantitiesOf } from '../resources/quantitiesOf'
import type { UnitCounts } from '../units/UnitCounts'
import { atHomeTalliesOf } from './atHomeTalliesOf'
import { carryOf } from './carryOf'
import { isEmptyParty } from './isEmptyParty'
import type { MarchFormContent, PlotCamp } from './marchFormOf'
import { oneWaySecondsOf } from './oneWaySecondsOf'
import { partyBattleOf } from './partyBattleOf'
import { type PartyEntries, partyOf } from './partyOf'
import { partyReasonOf } from './partyReasonOf'
import { roadMarksOf } from './roadMarksOf'

export interface AttackTarget {
  readonly province: number
  readonly plot: number
  readonly terrain: Terrain
  readonly camp: PlotCamp
}

function lootOf(
  terrain: Terrain,
  campStrength: number,
  survivors: UnitCounts,
  fief: FiefOverview,
): ResourceAmounts {
  const rates = { ...fief.forageTerms.yieldPerHour[terrain], gold: 0 }
  const yielded = Object.values(rates).filter((rate) => rate > 0).length
  const share = Math.floor(
    Math.min(fief.combatTerms.lootPerStrength * campStrength, carryOf(survivors, fief)) /
      (yielded + 1),
  )
  const carried = (rate: number): number => (rate > 0 ? share : 0)
  return {
    wood: carried(rates.wood),
    stone: carried(rates.stone),
    iron: carried(rates.iron),
    gold: share,
    food: carried(rates.food),
  }
}

function previewOf(
  target: AttackTarget,
  party: UnitCounts,
  fief: FiefOverview,
): ReadonlyArray<PreviewLine> {
  const oneWaySeconds = oneWaySecondsOf(target, party, fief)
  const { tier, strength } = target.camp
  const battle = partyBattleOf(party, strength, fief)
  const loot = quantitiesOf(lootOf(target.terrain, strength, battle.survivors, fief))
  const lines: ReadonlyArray<PreviewLine> = [
    {
      heading: copy.march.roadHeading,
      value: formatDuration(oneWaySeconds),
      isNumeral: true,
      marks: roadMarksOf(fief),
    },
    {
      heading: copy.march.returnHeading,
      value: formatDuration(2 * oneWaySeconds),
      isNumeral: true,
    },
    {
      heading: copy.march.campHeading,
      value: copy.map.campStrength(tier, strength),
      isNumeral: false,
    },
    {
      heading: copy.march.battleHeading,
      value: copy.march.battleOutcome(battle.isWon),
      isNumeral: false,
    },
    {
      heading: copy.march.lossesHeading,
      value: copy.march.party(battle.unitsLost, party),
      isNumeral: false,
    },
    { heading: copy.march.campLossesHeading, value: String(battle.campLost), isNumeral: true },
    {
      heading: copy.march.survivorsHeading,
      value: copy.march.party(battle.survivors, party),
      isNumeral: false,
    },
  ]
  return loot.length === 0
    ? lines
    : [
        ...lines,
        { heading: copy.march.lootHeading, value: copy.march.loot(loot), isNumeral: false },
      ]
}

function stateOf(party: UnitCounts | undefined, fief: FiefOverview): MarchActionState {
  if (fief.march !== null) {
    return { kind: 'blocked', reason: copy.march.marchAway }
  }
  if (party === undefined) {
    return { kind: 'blocked', reason: copy.march.invalidCount }
  }
  const reason = partyReasonOf(party, fief)
  return reason === undefined ? { kind: 'affordable' } : { kind: 'blocked', reason }
}

export function attackFormOf(
  target: AttackTarget,
  entries: PartyEntries,
  fief: FiefOverview,
): MarchFormContent {
  const party = partyOf(entries)
  return {
    title: copy.march.attackTitle(target.province, target.plot),
    artSrc: campArtOf(target.camp.tier),
    atHome: atHomeTalliesOf(fief),
    isFieldDisabled: fief.march !== null,
    preview:
      party === undefined || isEmptyParty(party) ? undefined : previewOf(target, party, fief),
    actionLabel: copy.march.attack,
    state: stateOf(party, fief),
  }
}
