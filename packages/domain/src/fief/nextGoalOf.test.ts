import { assert, describe, expect, it } from 'vitest'
import type {
  BuildingCatalog,
  BuildingKind,
  BuildingLevel,
  FiefSettings,
  Goal,
} from '../ports/BuildingCatalog'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import type { BuildQueue } from './BuildQueue'
import type { BuildSlot } from './BuildSlot'
import { Fief, type Stocks } from './Fief'
import type { FiefBuildingLevels } from './FiefBuildingLevels'
import { noStoreFull } from './FullSince'
import { nextGoalOf } from './nextGoalOf'

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const finishInstant = Instant.fromEpochMilliseconds(86_400_000 + 600_000)

const noCost: Stocks = { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 }

const ampleStocks: Stocks = { wood: 1000, stone: 1000, iron: 1000, gold: 1000, food: 1000 }

const fiefSettings: FiefSettings = {
  startingStocks: noCost,
  startingCapacity: 1000,
  basePeasantSupply: 4,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 0, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'iron', ratePerHour: 10 },
  },
  buildQueueCap: 4,
  fiefCap: 2,
  units: plainUnits,
  forage: plainForage,
  camps: plainCamps,
  seasons: neutralSeasons,
  goals: [],
}

const catalogLevels: ReadonlyArray<BuildingLevel> = [
  {
    building: 'sawmill',
    level: 1,
    cost: { ...noCost, wood: 50, stone: 20 },
    durationSeconds: 60,
    peasantOccupancy: 3,
    ratePerHour: 20,
  },
  {
    building: 'sawmill',
    level: 2,
    cost: { ...noCost, wood: 90, stone: 40 },
    durationSeconds: 120,
    peasantOccupancy: 4,
    ratePerHour: 30,
  },
  {
    building: 'quarry',
    level: 1,
    cost: { ...noCost, wood: 40 },
    durationSeconds: 60,
    peasantOccupancy: 3,
    ratePerHour: 20,
  },
  {
    building: 'farm',
    level: 1,
    cost: { ...noCost, wood: 30 },
    durationSeconds: 60,
    peasantOccupancy: 0,
    ratePerHour: 20,
    peasantSupply: 2,
  },
]

const catalogWithGoals = (goals: ReadonlyArray<Goal>): BuildingCatalog => ({
  levelOf: (building, level) =>
    catalogLevels.find((line) => line.building === building && line.level === level),
  artLevelOf: () => undefined,
  fiefSettings: () => ({ ...fiefSettings, goals }),
})

const noBuildings: FiefBuildingLevels = {
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
  library: 0,
  barracks: 0,
}

type FiefState = {
  readonly stocks?: Stocks
  readonly buildingLevels?: Partial<FiefBuildingLevels>
  readonly slot?: BuildSlot
  readonly buildQueue?: BuildQueue
}

const fiefWith = ({
  stocks = ampleStocks,
  buildingLevels = {},
  slot = { kind: 'idle' },
  buildQueue = [],
}: FiefState): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'founder',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 1, plot: 7 },
    stocks,
    storedAt: storedInstant,
    buildingLevels: { ...noBuildings, ...buildingLevels },
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
    slot,
    buildQueue,
    studySlot: { kind: 'idle' },
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    fullSince: noStoreFull,
    guidanceDismissedAt: null,
  })
  assert(restored.ok)
  return restored.value
}

const busySlot = (building: BuildingKind, targetLevel: number): BuildSlot => ({
  kind: 'busy',
  building,
  targetLevel,
  startedAt: storedInstant,
  finishesAt: finishInstant,
  cost: noCost,
})

describe('nextGoalOf', () => {
  it('answers the first unmet goal in content order', () => {
    const catalog = catalogWithGoals([
      { building: 'sawmill', level: 1 },
      { building: 'farm', level: 1 },
    ])

    const goal = nextGoalOf(fiefWith({}), catalog)

    assert(goal.ok)
    expect(goal.value).toEqual({
      position: 1,
      count: 2,
      building: 'sawmill',
      level: 1,
      state: 'pending',
      missing: { resources: [], peasants: 0 },
    })
  })

  it('skips a goal met at the built level', () => {
    const catalog = catalogWithGoals([
      { building: 'sawmill', level: 1 },
      { building: 'farm', level: 1 },
    ])

    const goal = nextGoalOf(fiefWith({ buildingLevels: { sawmill: 2 } }), catalog)

    assert(goal.ok)
    expect([goal.value?.position, goal.value?.building, goal.value?.level]).toEqual([2, 'farm', 1])
  })

  it('reads underway while the slot or the queue holds the next level', () => {
    const catalog = catalogWithGoals([{ building: 'farm', level: 1 }])
    const farmInTheSlot = fiefWith({ slot: busySlot('farm', 1) })
    const farmInTheQueue = fiefWith({
      slot: busySlot('quarry', 1),
      buildQueue: [{ building: 'farm', targetLevel: 1, cost: noCost, durationSeconds: 60 }],
    })

    const goals = [nextGoalOf(farmInTheSlot, catalog), nextGoalOf(farmInTheQueue, catalog)]

    expect(goals.map((goal) => (goal.ok ? goal.value?.state : goal.error.kind))).toEqual([
      'underway',
      'underway',
    ])
  })

  it('names the resources short for the next level', () => {
    const catalog = catalogWithGoals([{ building: 'sawmill', level: 2 }])
    const shortOfWoodAndStone = fiefWith({ stocks: { ...ampleStocks, wood: 30, stone: 12.5 } })

    const goal = nextGoalOf(shortOfWoodAndStone, catalog)

    assert(goal.ok && goal.value?.state === 'pending')
    expect(goal.value.missing).toEqual({
      resources: [
        { resource: 'wood', amount: 20 },
        { resource: 'stone', amount: 7.5 },
      ],
      peasants: 0,
    })
  })

  it('names the free peasants short on the projected fief', () => {
    const catalog = catalogWithGoals([{ building: 'sawmill', level: 1 }])
    const quarryTakingThreeOfFour = fiefWith({ slot: busySlot('quarry', 1) })

    const goal = nextGoalOf(quarryTakingThreeOfFour, catalog)

    assert(goal.ok && goal.value?.state === 'pending')
    expect(goal.value.missing).toEqual({ resources: [], peasants: 2 })
  })

  it('answers no goal once every goal is met', () => {
    const catalog = catalogWithGoals([
      { building: 'sawmill', level: 1 },
      { building: 'farm', level: 1 },
    ])

    const goal = nextGoalOf(fiefWith({ buildingLevels: { sawmill: 1, farm: 3 } }), catalog)

    assert(goal.ok)
    expect(goal.value).toBeUndefined()
  })
})
