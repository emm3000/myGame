import type { FiefOverview, ResourceAmounts, Terrain } from '@mygame/contracts'
import { copy } from '../copy'
import { formatDuration } from '../design-system/formatDuration'
import type { PreviewLine } from '../design-system/PreviewLines'
import type { SubmitActionState } from '../design-system/SubmitAction'
import { recruitCountOf } from '../fief/unitCardOf'
import { quantitiesOf } from '../resources/quantitiesOf'
import { infantryAtHomeOf } from './infantryAtHomeOf'
import type { MarchFormContent, PlotCamp } from './marchFormOf'
import { oneWaySecondsOf } from './oneWaySecondsOf'

export interface AttackTarget {
  readonly province: number
  readonly plot: number
  readonly terrain: Terrain
  readonly camp: PlotCamp
}

interface PreviewedBattle {
  readonly isWon: boolean
  readonly infantryLost: number
  readonly campLost: number
  readonly survivors: number
}

function battleOf(infantry: number, campStrength: number, fief: FiefOverview): PreviewedBattle {
  const { infantryStrength } = fief.combatTerms
  const ownStrength = infantry * infantryStrength
  if (ownStrength > campStrength) {
    const infantryLost = Math.min(
      infantry - 1,
      Math.ceil((campStrength * campStrength) / (infantry * infantryStrength * infantryStrength)),
    )
    return { isWon: true, infantryLost, campLost: campStrength, survivors: infantry - infantryLost }
  }
  const campLost = Math.min(campStrength - 1, Math.ceil((ownStrength * ownStrength) / campStrength))
  return { isWon: false, infantryLost: infantry, campLost, survivors: 0 }
}

function lootOf(
  terrain: Terrain,
  campStrength: number,
  survivors: number,
  fief: FiefOverview,
): ResourceAmounts {
  const rates = { ...fief.forageTerms.yieldPerHour[terrain], gold: 0 }
  const yielded = Object.values(rates).filter((rate) => rate > 0).length
  const share = Math.floor(
    Math.min(
      fief.combatTerms.lootPerStrength * campStrength,
      fief.forageTerms.carryPerInfantry * survivors,
    ) /
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
  infantry: number,
  fief: FiefOverview,
): ReadonlyArray<PreviewLine> {
  const oneWaySeconds = oneWaySecondsOf(target, fief)
  const { tier, strength } = target.camp
  const battle = battleOf(infantry, strength, fief)
  const loot = quantitiesOf(lootOf(target.terrain, strength, battle.survivors, fief))
  const lines: ReadonlyArray<PreviewLine> = [
    { heading: copy.march.roadHeading, value: formatDuration(oneWaySeconds), isNumeral: true },
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
      value: copy.march.infantry(battle.infantryLost),
      isNumeral: false,
    },
    { heading: copy.march.campLossesHeading, value: String(battle.campLost), isNumeral: true },
    {
      heading: copy.march.survivorsHeading,
      value: copy.march.infantry(battle.survivors),
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

function stateOf(infantry: number | undefined, fief: FiefOverview): SubmitActionState {
  if (fief.march !== null) {
    return { kind: 'blocked', reason: copy.march.marchAway }
  }
  if (infantry === undefined) {
    return { kind: 'blocked', reason: copy.march.invalidInfantry }
  }
  const atHome = infantryAtHomeOf(fief)
  if (infantry > atHome) {
    return { kind: 'blocked', reason: copy.march.notEnoughAtHome(infantry, atHome) }
  }
  return { kind: 'affordable' }
}

export function attackFormOf(
  target: AttackTarget,
  entry: string,
  fief: FiefOverview,
): MarchFormContent {
  const infantry = recruitCountOf(entry)
  const atHome = infantryAtHomeOf(fief)
  return {
    title: copy.march.attackTitle(target.province, target.plot),
    count: atHome,
    countLabel: copy.march.atHome(atHome),
    isFieldDisabled: fief.march !== null,
    preview: infantry === undefined ? undefined : previewOf(target, infantry, fief),
    actionLabel: copy.march.attack,
    state: stateOf(infantry, fief),
  }
}
