import { type BuildingKind, ResourceKindSchema } from '@mygame/contracts'
import { copy } from '../copy'
import type { BuildingCardProps, BuildingCost } from '../design-system/BuildingCard'
import { buildingArtOf } from '../design-system/buildingArtOf'
import { capitalize } from '../design-system/capitalize'
import type { LiveFief } from './liveFief'

export type BuildingCardContent = Omit<
  BuildingCardProps,
  'titleElement' | 'isWaiting' | 'onUpgrade'
>

const { names } = copy

type NextLevel = NonNullable<LiveFief['overview']['buildings'][BuildingKind]['nextLevel']>

const shortfallOf = (cost: number, amount: number): number => Math.max(0, cost - Math.floor(amount))

function costsOf(nextLevel: NextLevel, fief: LiveFief): ReadonlyArray<BuildingCost> {
  const resourceCosts = ResourceKindSchema.options
    .filter((kind) => nextLevel.cost[kind] > 0)
    .map((kind) => ({
      kind,
      amount: nextLevel.cost[kind],
      isShort: shortfallOf(nextLevel.cost[kind], fief.amounts[kind]) > 0,
    }))
  const peasantCost = {
    kind: 'peasants' as const,
    amount: nextLevel.peasants,
    isShort: nextLevel.peasants > fief.overview.peasants.projectedFree,
  }
  return nextLevel.peasants > 0 ? [...resourceCosts, peasantCost] : resourceCosts
}

function isQueueFull({ slot, queue }: LiveFief['overview']): boolean {
  return slot.kind === 'busy' && queue.entries.length >= queue.cap
}

function stateOf(nextLevel: NextLevel, fief: LiveFief): BuildingCardProps['state'] {
  if (isQueueFull(fief.overview)) {
    return { kind: 'queueFull', reason: copy.refusals.QueueFull }
  }
  const { projectedFree } = fief.overview.peasants
  if (nextLevel.peasants > projectedFree) {
    return {
      kind: 'notEnoughPeasants',
      reason: copy.fief.notEnoughPeasants(nextLevel.peasants, projectedFree),
    }
  }
  const shortfalls = ResourceKindSchema.options
    .map((kind) => ({ kind, missing: shortfallOf(nextLevel.cost[kind], fief.amounts[kind]) }))
    .filter(({ missing }) => missing > 0)
    .map(({ kind, missing }) => ({ amount: missing, resource: kind }))
  if (shortfalls.length > 0) {
    return { kind: 'tooExpensive', reason: copy.fief.tooExpensive(shortfalls) }
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
