import {
  fiefAtMaxLevel,
  fiefMaxLevel,
  fiefNextLevel,
  fiefNotEnoughPeasants,
  fiefUpgrade,
  namesLevel,
  refusalQueueFull,
} from '@mygame/catalog'
import type { BuildingKind } from '@mygame/contracts'
import type { BuildingCardProps } from '../design-system/BuildingCard'
import { buildingArtOf } from '../design-system/buildingArtOf'
import type { CardActionState } from '../design-system/CardAction'
import type { CardCost } from '../design-system/CostList'
import { capitalize } from '../design-system/capitalize'
import { buildingNameOf } from './buildingNameOf'
import { isBlockedByPeasants } from './isBlockedByPeasants'
import { isQueueFull } from './isQueueFull'
import type { LiveFief } from './liveFief'
import { peasantCostOf } from './peasantCostOf'
import { readyLineOf } from './readyLineOf'
import { resourceCostsOf } from './resourceCostsOf'
import { shortfallsOf } from './shortfallsOf'
import { tooExpensiveLineOf } from './tooExpensiveLineOf'

export type BuildingCardContent = Omit<
  BuildingCardProps,
  'titleElement' | 'isWaiting' | 'onUpgrade' | 'art'
> & { readonly artSrc: string | undefined }

type NextLevel = NonNullable<LiveFief['overview']['buildings'][BuildingKind]['nextLevel']>

function costsOf(nextLevel: NextLevel, fief: LiveFief): ReadonlyArray<CardCost> {
  const resourceCosts = resourceCostsOf(nextLevel.cost, fief.amounts)
  const peasantCost = peasantCostOf(
    nextLevel.peasants,
    nextLevel.peasants > fief.overview.peasants.projectedFree,
  )
  return nextLevel.peasants > 0 ? [...resourceCosts, peasantCost] : resourceCosts
}

function stateOf(building: BuildingKind, nextLevel: NextLevel, fief: LiveFief): CardActionState {
  if (isQueueFull(fief.overview)) {
    return { kind: 'blocked', reason: refusalQueueFull() }
  }
  if (isBlockedByPeasants(building, fief.overview)) {
    return {
      kind: 'blocked',
      reason: fiefNotEnoughPeasants({
        needed: nextLevel.peasants,
        free: fief.overview.peasants.projectedFree,
      }),
    }
  }
  const shortfalls = shortfallsOf(nextLevel.cost, fief.amounts)
  if (shortfalls.length > 0) {
    return {
      kind: 'blocked',
      reason: tooExpensiveLineOf(shortfalls),
      ready: readyLineOf(nextLevel.cost, fief),
    }
  }
  return { kind: 'affordable' }
}

export function buildingCardOf(building: BuildingKind, fief: LiveFief): BuildingCardContent {
  const { level, nextLevel } = fief.overview.buildings[building]
  const common = {
    name: capitalize(buildingNameOf(building)),
    levelLabel: namesLevel({ level }),
    actionLabel: fiefUpgrade(),
    artSrc: buildingArtOf(building, level),
  }
  if (nextLevel === null) {
    return {
      ...common,
      effect: fiefAtMaxLevel(),
      costs: [],
      durationSeconds: 0,
      state: { kind: 'atMaxLevel', label: fiefMaxLevel() },
    }
  }
  return {
    ...common,
    effect: fiefNextLevel({ level: nextLevel.level }),
    costs: costsOf(nextLevel, fief),
    durationSeconds: nextLevel.durationSeconds,
    state: stateOf(building, nextLevel, fief),
  }
}
