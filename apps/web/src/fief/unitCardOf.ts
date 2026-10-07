import type { UnitKind } from '@mygame/contracts'
import { copy } from '../copy'
import type { OrderActionState } from '../design-system/CardAction'
import type { CardCost } from '../design-system/CostList'
import { formatDuration } from '../design-system/formatDuration'
import type { LockedUnitCardProps } from '../design-system/LockedUnitCard'
import type { UnitCardProps } from '../design-system/UnitCard'
import type { UnitTally } from '../design-system/UnitCount'
import { costTimes } from './costTimes'
import type { LiveFief } from './liveFief'
import { peasantCostOf } from './peasantCostOf'
import { readyLineOf } from './readyLineOf'
import { resourceCostsOf } from './resourceCostsOf'
import { shortfallsOf } from './shortfallsOf'

export type UnitCardContent =
  | ({ readonly kind: 'open' } & Pick<
      UnitCardProps,
      | 'unit'
      | 'name'
      | 'tallies'
      | 'fieldLabel'
      | 'isFieldDisabled'
      | 'costs'
      | 'actionLabel'
      | 'state'
    >)
  | ({ readonly kind: 'locked' } & Omit<LockedUnitCardProps, 'titleElement'>)

const wholeCountPattern = /^[0-9]+$/

export function recruitCountOf(entry: string): number | undefined {
  if (!wholeCountPattern.test(entry)) {
    return undefined
  }
  const count = Number(entry)
  return count >= 1 ? count : undefined
}

function stateOf(unit: UnitKind, count: number | undefined, fief: LiveFief): OrderActionState {
  if (fief.overview.recruitOrder !== null) {
    return { kind: 'blocked', reason: copy.army.orderRunning }
  }
  if (count === undefined) {
    return { kind: 'blocked', reason: copy.army.invalidCount }
  }
  const terms = fief.overview.recruitTerms[unit]
  const neededPeasants = terms.peasants * count
  const freePeasants = fief.overview.peasants.lowestFree
  if (neededPeasants > freePeasants) {
    return { kind: 'blocked', reason: copy.fief.notEnoughPeasants(neededPeasants, freePeasants) }
  }
  const cost = costTimes(terms.cost, count)
  const shortfalls = shortfallsOf(cost, fief.amounts)
  if (shortfalls.length > 0) {
    return {
      kind: 'blocked',
      reason: copy.fief.tooExpensive(shortfalls),
      ready: readyLineOf(cost, fief),
    }
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
    peasantCostOf(neededPeasants, neededPeasants > fief.overview.peasants.lowestFree),
  ]
}

function talliesOf(unit: UnitKind, fief: LiveFief): ReadonlyArray<UnitTally> {
  const away = fief.overview.march?.units[unit] ?? 0
  const atHome = fief.units[unit] - away
  if (away === 0) {
    return [{ count: atHome, label: copy.army.atHome(unit, atHome) }]
  }
  return [
    { count: atHome, label: copy.army.atHomeBeforeAway(unit, atHome) },
    { count: away, label: copy.army.away(unit, away) },
  ]
}

export function unitCardOf(unit: UnitKind, entry: string, fief: LiveFief): UnitCardContent {
  const requiredLevel = fief.overview.unitTerms[unit].barracksLevel
  const builtLevel = fief.overview.buildings.barracks.level
  if (builtLevel < requiredLevel) {
    return {
      kind: 'locked',
      unit,
      name: copy.army.unitTitle(unit),
      tallies: talliesOf(unit, fief),
      requirement: copy.army.requires(requiredLevel),
      reason: copy.army.barracksTooLow(requiredLevel, builtLevel),
    }
  }
  const count = recruitCountOf(entry)
  const recruit = copy.army.recruit(unit)
  return {
    kind: 'open',
    unit,
    name: copy.army.unitTitle(unit),
    tallies: talliesOf(unit, fief),
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
