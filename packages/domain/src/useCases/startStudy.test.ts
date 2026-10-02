import { assert, describe, expect, it } from 'vitest'
import { Fief, type StoredFief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import type {
  ArtLevel,
  BuildingCatalog,
  FiefSettings,
  LibraryLevel,
} from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { Instant } from '../time/Instant'
import { startStudy } from './startStudy'

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const oneHourLater = Instant.fromEpochMilliseconds(86_400_000 + 3_600_000)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 4,
  plotsPerProvince: 15,
  baseRates: { wood: 10, stone: 10, iron: 5, gold: 2, food: 10 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 10 },
    uplands: { resource: 'stone', ratePerHour: 10 },
    ridges: { resource: 'iron', ratePerHour: 10 },
  },
  buildQueueCap: 4,
  units: plainUnits,
  forage: plainForage,
  camps: plainCamps,
  seasons: neutralSeasons,
}

const libraryLevel = (level: number): LibraryLevel => ({
  building: 'library',
  level,
  cost: { wood: 120, stone: 160, iron: 40, gold: 0, food: 0 },
  durationSeconds: 300,
  peasantOccupancy: 1,
})

const smithingLevelOne: ArtLevel = {
  art: 'smithing',
  level: 1,
  cost: { wood: 40, stone: 30, iron: 50, gold: 20, food: 0 },
  durationSeconds: 1800,
  requiredLibraryLevel: 1,
  resource: 'iron',
  ratePercent: 5,
}

const smithingLevelTwo: ArtLevel = {
  ...smithingLevelOne,
  level: 2,
  durationSeconds: 1000,
  requiredLibraryLevel: 3,
  ratePercent: 10,
}

const masonryLevelOne: ArtLevel = {
  art: 'masonry',
  level: 1,
  cost: { wood: 30, stone: 30, iron: 10, gold: 10, food: 0 },
  durationSeconds: 1200,
  requiredLibraryLevel: 1,
  resource: 'stone',
  ratePercent: 5,
}

const catalog: BuildingCatalog = {
  levelOf: (building, level) =>
    building === 'library' && level >= 1 && level <= 3 ? libraryLevel(level) : undefined,
  artLevelOf: (art, level) =>
    [smithingLevelOne, smithingLevelTwo, masonryLevelOne].find(
      (known) => known.art === art && known.level === level,
    ),
  fiefSettings: () => fiefSettings,
}

const levelsWithLibrary = (library: number): FiefBuildingLevels => ({
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
  library,
  barracks: 0,
})

const storedFief = (overrides: Partial<StoredFief>): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'lord',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 3, plot: 1 },
    stocks: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    storedAt: storedInstant,
    buildingLevels: levelsWithLibrary(1),
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 0, cavalry: 0 },
    slot: { kind: 'idle' },
    buildQueue: [],
    studySlot: { kind: 'idle' },
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    ...overrides,
  })
  assert(restored.ok)
  return restored.value
}

describe('startStudy', () => {
  it('starts the next level of an art in the idle study slot', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await startStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing' },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.studySlot).toEqual({
      kind: 'busy',
      art: 'smithing',
      targetLevel: 1,
      startedAt: storedInstant,
      finishesAt: Instant.fromEpochMilliseconds(86_400_000 + 900_000),
      cost: smithingLevelOne.cost,
    })
  })

  it('debits materials and gold at the start', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await startStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing' },
      { fiefs, catalog, clock: frozenClock(oneHourLater) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
    expect(stored?.stocks).toEqual({ wood: 70, stone: 80, iron: 65, gold: 82, food: 110 })
    expect(stored?.storedAt).toBe(oneHourLater)
  })

  it('divides the study duration by one plus the library level', async () => {
    const fiefs = inMemoryFiefRepository([
      storedFief({
        buildingLevels: levelsWithLibrary(2),
        artLevels: { smithing: 1, masonry: 0 },
      }),
    ])
    const catalogWithReachableSecondLevel: BuildingCatalog = {
      ...catalog,
      artLevelOf: (art, level) =>
        art === 'smithing' && level === 2
          ? { ...smithingLevelTwo, requiredLibraryLevel: 2 }
          : catalog.artLevelOf(art, level),
    }

    const result = await startStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing' },
      { fiefs, catalog: catalogWithReachableSecondLevel, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.studySlot).toMatchObject({
      kind: 'busy',
      targetLevel: 2,
      finishesAt: Instant.fromEpochMilliseconds(86_400_000 + 334_000),
    })
  })

  it('refuses a study while another runs', async () => {
    const studyingFief = storedFief({
      studySlot: {
        kind: 'busy',
        art: 'masonry',
        targetLevel: 1,
        startedAt: storedInstant,
        finishesAt: oneHourLater,
        cost: masonryLevelOne.cost,
      },
    })
    const fiefs = inMemoryFiefRepository([studyingFief])

    const result = await startStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing' },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'StudySlotBusy', art: 'masonry' }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(studyingFief)
  })

  it('refuses a study without the library level it requires', async () => {
    const unlettered = storedFief({ buildingLevels: levelsWithLibrary(0) })
    const fiefs = inMemoryFiefRepository([unlettered])

    const result = await startStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing' },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(
      err({ kind: 'LibraryLevelTooLow', requiredLibraryLevel: 1, libraryLevel: 0 }),
    )
    expect(fiefs.storedFiefOf('fief-1')).toBe(unlettered)
  })

  it('refuses a study beyond the last level of the art', async () => {
    const mastered = storedFief({ artLevels: { smithing: 0, masonry: 1 } })
    const fiefs = inMemoryFiefRepository([mastered])

    const result = await startStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'masonry' },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'ArtMaxLevelReached', art: 'masonry', level: 1 }))
    expect(fiefs.storedFiefOf('fief-1')).toBe(mastered)
  })

  it('refuses a study the stocks cannot pay', async () => {
    const poor = storedFief({ stocks: { wood: 100, stone: 100, iron: 45, gold: 5, food: 100 } })
    const fiefs = inMemoryFiefRepository([poor])

    const result = await startStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing' },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(
      err({
        kind: 'InsufficientResources',
        missing: { wood: 0, stone: 0, iron: 5, gold: 15, food: 0 },
      }),
    )
    expect(fiefs.storedFiefOf('fief-1')).toBe(poor)
  })

  it('studies while the build slot is busy', async () => {
    const buildingSlot = {
      kind: 'busy',
      building: 'sawmill',
      targetLevel: 1,
      startedAt: storedInstant,
      finishesAt: oneHourLater,
      cost: { wood: 60, stone: 15, iron: 0, gold: 0, food: 10 },
    } as const
    const fiefs = inMemoryFiefRepository([storedFief({ slot: buildingSlot })])

    const result = await startStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing' },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
    expect(stored?.slot).toEqual(buildingSlot)
    expect(stored?.buildQueue).toEqual([])
    expect(stored?.studySlot.kind).toBe('busy')
  })

  it('charges no peasants for a study', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await startStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing' },
      { fiefs, catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(result.value.projectedBuildingLevels).toEqual(levelsWithLibrary(1))
  })
})

const MILLISECONDS_PER_DAY = 86_400_000

const seasonEpoch = Instant.fromEpochMilliseconds(1_791_158_400_000)

const daysAfterSeasonEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(seasonEpoch.epochMilliseconds + days * MILLISECONDS_PER_DAY)

const midWinter = daysAfterSeasonEpoch(24)

const seasonalCatalog: BuildingCatalog = {
  ...catalog,
  artLevelOf: (art, level) =>
    art === 'smithing' && level === 1 ? { ...smithingLevelOne, durationSeconds: 1000 } : undefined,
  fiefSettings: () => ({
    ...fiefSettings,
    seasons: {
      ...neutralSeasons,
      epoch: seasonEpoch,
      durationPercent: {
        spring: { build: 100, study: 100, train: 100, road: 100 },
        summer: { build: 75, study: 100, train: 100, road: 100 },
        autumn: { build: 100, study: 100, train: 100, road: 75 },
        winter: { build: 100, study: 75, train: 100, road: 100 },
      },
    },
  }),
}

describe('startStudy across seasons', () => {
  it('shortens a study duration in winter with one rounding', async () => {
    const fiefs = inMemoryFiefRepository([
      storedFief({ storedAt: midWinter, buildingLevels: levelsWithLibrary(2) }),
    ])

    const result = await startStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing' },
      { fiefs, catalog: seasonalCatalog, clock: frozenClock(midWinter) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.studySlot).toMatchObject({
      kind: 'busy',
      finishesAt: Instant.fromEpochMilliseconds(midWinter.epochMilliseconds + 250_000),
    })
  })
})
