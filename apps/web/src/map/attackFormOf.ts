import {
  mapCampStrength,
  marchAttack,
  marchAttackTitle,
  marchBattleHeading,
  marchBattleLost,
  marchBattleWon,
  marchCampHeading,
  marchCampLossesHeading,
  marchInvalidCount,
  marchLootHeading,
  marchLossesHeading,
  marchMarchAway,
  marchReturnHeading,
  marchRoadHeading,
  marchSurvivorsHeading,
} from '@mygame/catalog'
import type { FiefOverview, ResourceAmounts, Terrain } from '@mygame/contracts'
import type { MarchActionState } from '../design-system/CardAction'
import { formatDuration } from '../design-system/formatDuration'
import type { PreviewLine } from '../design-system/PreviewLines'
import { quantitiesOf } from '../resources/quantitiesOf'
import { quantitiesPhraseOf } from '../resources/quantitiesPhraseOf'
import { sentPartyPhraseOf } from '../units/sentPartyPhraseOf'
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
      heading: marchRoadHeading(),
      value: formatDuration(oneWaySeconds),
      isNumeral: true,
      marks: roadMarksOf(fief),
    },
    {
      heading: marchReturnHeading(),
      value: formatDuration(2 * oneWaySeconds),
      isNumeral: true,
    },
    {
      heading: marchCampHeading(),
      value: mapCampStrength({ tier, strength }),
      isNumeral: false,
    },
    {
      heading: marchBattleHeading(),
      value: battle.isWon ? marchBattleWon() : marchBattleLost(),
      isNumeral: false,
    },
    {
      heading: marchLossesHeading(),
      value: sentPartyPhraseOf(battle.unitsLost, party),
      isNumeral: false,
    },
    { heading: marchCampLossesHeading(), value: String(battle.campLost), isNumeral: true },
    {
      heading: marchSurvivorsHeading(),
      value: sentPartyPhraseOf(battle.survivors, party),
      isNumeral: false,
    },
  ]
  return loot.length === 0
    ? lines
    : [...lines, { heading: marchLootHeading(), value: quantitiesPhraseOf(loot), isNumeral: false }]
}

function stateOf(party: UnitCounts | undefined, fief: FiefOverview): MarchActionState {
  if (fief.march !== null) {
    return { kind: 'blocked', reason: marchMarchAway() }
  }
  if (party === undefined) {
    return { kind: 'blocked', reason: marchInvalidCount() }
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
    title: marchAttackTitle({ province: target.province, plot: target.plot }),
    atHome: atHomeTalliesOf(fief),
    isFieldDisabled: fief.march !== null,
    preview:
      party === undefined || isEmptyParty(party) ? undefined : previewOf(target, party, fief),
    actionLabel: marchAttack(),
    state: stateOf(party, fief),
  }
}
