import type { DomainError } from '../DomainError'
import type { BuildingCatalog, BuildingKind, BuildingLevel } from '../ports/BuildingCatalog'
import { err, ok, type Result } from '../Result'
import type { ResourceKind } from '../resources/Resources'
import { resourceKinds } from '../resources/resourceKinds'
import { derivePeasantsForUpgrade } from './derivePeasantsForUpgrade'
import { deriveProjectedFreePeasants } from './deriveProjectedFreePeasants'
import type { Fief, Stocks } from './Fief'
import { shortfallOf } from './shortfallOf'

export type ResourceShortfall = {
  readonly resource: ResourceKind
  readonly amount: number
}

export type GoalShortfall = {
  readonly resources: ReadonlyArray<ResourceShortfall>
  readonly peasants: number
}

type GoalProgress =
  | { readonly state: 'underway' }
  | { readonly state: 'pending'; readonly missing: GoalShortfall }

export type NextGoal = GoalProgress & {
  readonly position: number
  readonly count: number
  readonly building: BuildingKind
  readonly level: number
}

const resourcesShortOf = (stocks: Stocks, cost: Stocks): ReadonlyArray<ResourceShortfall> => {
  const missing = shortfallOf(stocks, cost)
  return resourceKinds
    .map((resource) => ({ resource, amount: missing[resource] }))
    .filter(({ amount }) => amount > 0)
}

const shortfallFor = (
  fief: Fief,
  next: BuildingLevel,
  catalog: BuildingCatalog,
): Result<GoalShortfall, DomainError> => {
  const needed = derivePeasantsForUpgrade(
    fief.projectedBuildingLevels,
    next.building,
    next.level,
    catalog,
  )
  if (!needed.ok) {
    return needed
  }
  const free = deriveProjectedFreePeasants(fief, catalog)
  if (!free.ok) {
    return free
  }
  return ok({
    resources: resourcesShortOf(fief.stocks, next.cost),
    peasants: Math.max(0, needed.value - free.value),
  })
}

export const nextGoalOf = (
  fief: Fief,
  catalog: BuildingCatalog,
): Result<NextGoal | undefined, DomainError> => {
  const { goals } = catalog.fiefSettings()
  const index = goals.findIndex((goal) => fief.buildingLevels[goal.building] < goal.level)
  const goal = goals[index]
  if (goal === undefined) {
    return ok(undefined)
  }
  const { building, level } = goal
  const placement = { position: index + 1, count: goals.length, building, level }
  if (fief.projectedBuildingLevels[building] > fief.buildingLevels[building]) {
    return ok({ ...placement, state: 'underway' })
  }
  const next = catalog.levelOf(building, fief.buildingLevels[building] + 1)
  if (next === undefined) {
    return err({ kind: 'UnknownBuildingLevel', building, level: fief.buildingLevels[building] + 1 })
  }
  const missing = shortfallFor(fief, next, catalog)
  if (!missing.ok) {
    return missing
  }
  return ok({ ...placement, state: 'pending', missing: missing.value })
}
