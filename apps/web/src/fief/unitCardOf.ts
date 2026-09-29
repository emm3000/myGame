import type { UnitKind } from '@mygame/contracts'
import { copy } from '../copy'
import type { CardCost } from '../design-system/CostList'
import { formatDuration } from '../design-system/formatDuration'
import type { UnitCardProps, UnitCardState } from '../design-system/UnitCard'
import type { LiveFief } from './liveFief'
import { resourceCostsOf } from './resourceCostsOf'
import { type ResourceCost, shortfallsOf } from './shortfallsOf'

export type UnitCardContent = Pick<
  UnitCardProps,
  | 'name'
  | 'count'
  | 'countLabel'
  | 'fieldLabel'
  | 'isFieldDisabled'
  | 'costs'
  | 'actionLabel'
  | 'state'
>

const wholeCountPattern = /^[0-9]+$/

export function recruitCountOf(entry: string): number | undefined {
  if (!wholeCountPattern.test(entry)) {
    return undefined
  }
  const count = Number(entry)
  return count >= 1 ? count : undefined
}

const costTimes = (cost: ResourceCost, count: number): ResourceCost => ({
  wood: cost.wood * count,
  stone: cost.stone * count,
  iron: cost.iron * count,
  gold: cost.gold * count,
  food: cost.food * count,
})

const freePeasantsOf = ({ peasants }: LiveFief['overview']): number =>
  Math.min(peasants.free, peasants.projectedFree)

function stateOf(unit: UnitKind, count: number | undefined, fief: LiveFief): UnitCardState {
  if (fief.overview.recruitOrder !== null) {
    return { kind: 'blocked', reason: copy.army.orderRunning }
  }
  if (count === undefined) {
    return { kind: 'blocked', reason: copy.army.invalidCount }
  }
  const terms = fief.overview.recruitTerms[unit]
  const neededPeasants = terms.peasants * count
  const freePeasants = freePeasantsOf(fief.overview)
  if (neededPeasants > freePeasants) {
    return { kind: 'blocked', reason: copy.fief.notEnoughPeasants(neededPeasants, freePeasants) }
  }
  const shortfalls = shortfallsOf(costTimes(terms.cost, count), fief.amounts)
  if (shortfalls.length > 0) {
    return { kind: 'blocked', reason: copy.fief.tooExpensive(shortfalls) }
  }
  return { kind: 'affordable' }
}

function costsOf(
  unit: UnitKind,
  count: number | undefined,
  fief: LiveFief,
): ReadonlyArray<CardCost> | undefined {
  if (count === undefined) {
    return undefined
  }
  const terms = fief.overview.recruitTerms[unit]
  const neededPeasants = terms.peasants * count
  return [
    ...resourceCostsOf(costTimes(terms.cost, count), fief.amounts),
    {
      kind: 'peasants',
      amount: neededPeasants,
      isShort: neededPeasants > freePeasantsOf(fief.overview),
    },
  ]
}

export function unitCardOf(unit: UnitKind, entry: string, fief: LiveFief): UnitCardContent {
  const count = recruitCountOf(entry)
  const unitCount = fief.units[unit]
  const recruit = copy.army.recruit(unit)
  return {
    name: copy.army.unitTitle(unit),
    count: unitCount,
    countLabel: copy.army.unitCount(unit, unitCount),
    fieldLabel: copy.army.countField(unit),
    isFieldDisabled: fief.overview.recruitOrder !== null,
    costs: costsOf(unit, count, fief),
    actionLabel:
      count === undefined
        ? recruit
        : `${recruit} · ${formatDuration(count * fief.overview.recruitTerms[unit].perUnitSeconds)}`,
    state: stateOf(unit, count, fief),
  }
}
