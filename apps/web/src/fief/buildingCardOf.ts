import type { BuildingKind } from '@mygame/contracts'
import { copy } from '../copy'
import type { BuildingCardProps } from '../design-system/BuildingCard'
import { buildingArtOf } from '../design-system/buildingArtOf'
import type { CardActionState } from '../design-system/CardAction'
import type { CardCost } from '../design-system/CostList'
import { capitalize } from '../design-system/capitalize'
import { isQueueFull } from './isQueueFull'
import type { LiveFief } from './liveFief'
import { readyLineOf } from './readyLineOf'
import { resourceCostsOf } from './resourceCostsOf'
import { shortfallsOf } from './shortfallsOf'

export type BuildingCardContent = Omit<
  BuildingCardProps,
  'titleElement' | 'isWaiting' | 'onUpgrade'
>

const { names } = copy

type NextLevel = NonNullable<LiveFief['overview']['buildings'][BuildingKind]['nextLevel']>

function costsOf(nextLevel: NextLevel, fief: LiveFief): ReadonlyArray<CardCost> {
  const resourceCosts = resourceCostsOf(nextLevel.cost, fief.amounts)
  const peasantCost = {
    kind: 'peasants' as const,
    amount: nextLevel.peasants,
    isShort: nextLevel.peasants > fief.overview.peasants.projectedFree,
  }
  return nextLevel.peasants > 0 ? [...resourceCosts, peasantCost] : resourceCosts
}

function stateOf(nextLevel: NextLevel, fief: LiveFief): CardActionState {
  if (isQueueFull(fief.overview)) {
    return { kind: 'blocked', reason: copy.refusals.QueueFull }
  }
  const { projectedFree } = fief.overview.peasants
  if (nextLevel.peasants > projectedFree) {
    return {
      kind: 'blocked',
      reason: copy.fief.notEnoughPeasants(nextLevel.peasants, projectedFree),
    }
  }
  const shortfalls = shortfallsOf(nextLevel.cost, fief.amounts)
  if (shortfalls.length > 0) {
    return {
      kind: 'blocked',
      reason: copy.fief.tooExpensive(shortfalls),
      ready: readyLineOf(nextLevel.cost, fief),
    }
  }
  return { kind: 'affordable' }
}

export function buildingCardOf(building: BuildingKind, fief: LiveFief): BuildingCardContent {
  const { level, nextLevel } = fief.overview.buildings[building]
  const common = {
    name: capitalize(names.buildings[building]),
    levelLabel: names.level(level),
    actionLabel: copy.fief.upgrade,
    artSrc: buildingArtOf(building, level),
  }
  if (nextLevel === null) {
    return {
      ...common,
      effect: copy.fief.atMaxLevel,
      costs: [],
      durationSeconds: 0,
      state: { kind: 'atMaxLevel', label: copy.fief.maxLevel },
    }
  }
  return {
    ...common,
    effect: copy.fief.nextLevel(nextLevel.level),
    costs: costsOf(nextLevel, fief),
    durationSeconds: nextLevel.durationSeconds,
    state: stateOf(nextLevel, fief),
  }
}
