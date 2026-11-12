import { assert, describe, expect, it } from 'vitest'
import { plainTownLevels, plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { type TownShape, townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { BuildingLevel } from './BuildingLevel'
import type { BuildingLevels } from './BuildingLevels'
import { type NextGoal, nextGoalOf } from './nextGoalOf'
import type { TownCatalog } from './TownCatalog'
import type { TownGoal } from './TownSettings'

const noCost = { money: 0, food: 0, power: 0, material: 0 }

const storedAt = Instant.fromEpochMilliseconds(plainTownSettings.seasons.epoch.epochMilliseconds)

const shippedGoals: ReadonlyArray<TownGoal> = [
  { building: 'farm', level: 1 },
  { building: 'factory', level: 1 },
  { building: 'farm', level: 2 },
]

const nothingMissing = { resources: noCost, people: 0 }

const catalogWithGoals = (
  goals: ReadonlyArray<TownGoal>,
  levels: ReadonlyArray<BuildingLevel> = plainTownLevels,
): TownCatalog => townCatalogOf({ ...plainTownSettings, goals }, levels)

const goalOf = (
  town: Partial<TownShape>,
  catalog: TownCatalog = catalogWithGoals(shippedGoals),
): NextGoal | undefined => {
  const goal = nextGoalOf(townOf({ storedAt, ...town }), storedAt, catalog)
  assert(goal.ok)
  return goal.value
}

const builtTo = (buildingLevels: Partial<BuildingLevels>): Partial<TownShape> => ({
  buildingLevels,
})

const costlyFarm = plainTownLevels.map((line) =>
  line.building === 'farm' && line.level === 1
    ? { ...line, cost: { ...noCost, money: 100, material: 30 } }
    : line,
)

describe('nextGoalOf', () => {
  it('answers the first goal of the list not yet reached', () => {
    expect(goalOf(builtTo({ farm: 1 }))).toEqual({
      position: 2,
      count: 3,
      building: 'factory',
      level: 1,
      state: 'pending',
      missing: nothingMissing,
    })
  })

  it('reaches a building goal at its level', () => {
    expect(goalOf(builtTo({ farm: 1, factory: 1 }))).toMatchObject({
      position: 3,
      building: 'farm',
      level: 2,
    })
  })

  it('answers no goal once the list is done', () => {
    expect(goalOf(builtTo({ farm: 2, factory: 1 }))).toBeUndefined()
  })

  it('answers no goal when the content lists none', () => {
    expect(goalOf({}, catalogWithGoals([]))).toBeUndefined()
  })

  it('marks the goal underway while its level is in the work', () => {
    const town: Partial<TownShape> = {
      buildingLevels: { farm: 1 },
      workSlot: {
        kind: 'busy',
        building: 'farm',
        level: 2,
        cost: noCost,
        startedAt: storedAt,
        finishesAt: Instant.fromEpochMilliseconds(storedAt.epochMilliseconds + 60_000),
      },
      waitingList: [{ building: 'factory', level: 1, cost: noCost, durationSeconds: 60 }],
    }

    expect(goalOf(town)).toEqual({
      position: 2,
      count: 3,
      building: 'factory',
      level: 1,
      state: 'underway',
    })
  })

  it('marks a pending goal with the resources its next level lacks at the read', () => {
    const town = { stocks: { ...noCost, money: 40, material: 50 } }

    expect(goalOf(town, catalogWithGoals(shippedGoals, costlyFarm))).toMatchObject({
      state: 'pending',
      missing: { resources: { ...noCost, money: 60 }, people: 0 },
    })
  })

  it('marks a pending goal with the people its next level lacks', () => {
    const town = { hires: { worker: 25, truck: 0 } }

    expect(goalOf(town)).toMatchObject({
      state: 'pending',
      missing: { resources: noCost, people: 1 },
    })
  })

  it('counts the people of the next level toward a goal above it', () => {
    const town = { hires: { worker: 25, truck: 0 } }

    expect(goalOf(town, catalogWithGoals([{ building: 'farm', level: 2 }]))).toMatchObject({
      level: 2,
      missing: { people: 1 },
    })
  })

  it('counts the people that work in the waiting list already holds', () => {
    const town: Partial<TownShape> = {
      hires: { worker: 22, truck: 0 },
      workSlot: {
        kind: 'busy',
        building: 'office',
        level: 1,
        cost: noCost,
        startedAt: storedAt,
        finishesAt: Instant.fromEpochMilliseconds(storedAt.epochMilliseconds + 60_000),
      },
    }

    expect(goalOf(town)).toMatchObject({ building: 'farm', missing: { people: 3 } })
  })

  it('refuses a goal whose next level the content lacks', () => {
    const goal = nextGoalOf(
      townOf({ storedAt }),
      storedAt,
      catalogWithGoals([{ building: 'farm', level: 1 }], []),
    )

    expect(goal).toMatchObject({
      ok: false,
      error: { kind: 'UnknownTownBuildingLevel', building: 'farm', level: 1 },
    })
  })

  it('refuses a read before the town was stored', () => {
    const goal = nextGoalOf(
      townOf({ storedAt }),
      Instant.fromEpochMilliseconds(0),
      catalogWithGoals(shippedGoals),
    )

    expect(goal).toMatchObject({ ok: false, error: { kind: 'InstantBeforeStored' } })
  })
})
