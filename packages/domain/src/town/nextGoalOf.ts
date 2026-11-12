import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'
import type { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'
import type { BuildingKind } from './BuildingKind'
import type { BuildingLevel } from './BuildingLevel'
import { derivePeople } from './derivePeople'
import { resourceKinds } from './resourceKinds'
import type { Stocks } from './Stocks'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'

export type GoalShortfall = {
  readonly resources: Stocks
  readonly people: number
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

const resourcesShortOf = (stocks: Stocks, cost: Stocks): Stocks => {
  const missing = { ...stocks }
  for (const resource of resourceKinds) {
    missing[resource] = Math.max(0, cost[resource] - stocks[resource])
  }
  return missing
}

const peopleShortOf = (
  town: Town,
  next: BuildingLevel,
  catalog: TownCatalog,
): Result<number, DomainError> => {
  const people = derivePeople(
    { ...town.projectedLevels, [next.building]: next.level },
    town.staffedHires,
    catalog,
  )
  return people.ok ? ok(Math.max(0, -people.value.free)) : people
}

const shortfallOf = (
  town: Town,
  building: BuildingKind,
  at: Instant,
  catalog: TownCatalog,
): Result<GoalShortfall, DomainError> => {
  const level = town.buildingLevels[building] + 1
  const next = catalog.levelOf(building, level)
  if (next?.building !== building) {
    return err({ kind: 'UnknownTownBuildingLevel', building, level })
  }
  const accrual = accrueTown(town, catalog, at)
  if (!accrual.ok) {
    return accrual
  }
  const people = peopleShortOf(town, next, catalog)
  if (!people.ok) {
    return people
  }
  return ok({ resources: resourcesShortOf(accrual.value.stocks, next.cost), people: people.value })
}

export const nextGoalOf = (
  town: Town,
  at: Instant,
  catalog: TownCatalog,
): Result<NextGoal | undefined, DomainError> => {
  if (at.epochMilliseconds < town.storedAt.epochMilliseconds) {
    return err({ kind: 'InstantBeforeStored', storedAt: town.storedAt, now: at })
  }
  const { goals } = catalog.townSettings()
  const index = goals.findIndex(({ building, level }) => town.buildingLevels[building] < level)
  const goal = goals[index]
  if (goal === undefined) {
    return ok(undefined)
  }
  const { building, level } = goal
  const placement = { position: index + 1, count: goals.length, building, level }
  if (town.projectedLevels[building] > town.buildingLevels[building]) {
    return ok({ ...placement, state: 'underway' })
  }
  const missing = shortfallOf(town, building, at, catalog)
  return missing.ok ? ok({ ...placement, state: 'pending', missing: missing.value }) : missing
}
