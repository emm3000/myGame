import { assert, describe, expect, it } from 'vitest'
import type { BusySlot } from '../fief/BuildSlot'
import { Fief, type Stocks, type StoredFief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import type { BusyStudySlot } from '../fief/StudySlot'
import type {
  ArtLevel,
  BuildingCatalog,
  FiefSettings,
  LibraryLevel,
  ProducerLevel,
} from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryChronicle } from '../testing/inMemoryChronicle'
import { inMemoryFiefRepository } from '../testing/inMemoryFiefRepository'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { refusingChronicle } from '../testing/refusingChronicle'
import { Instant } from '../time/Instant'
import { cancelStudy } from './cancelStudy'

const MILLISECONDS_PER_HOUR = 3_600_000

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const hoursAfterStored = (hours: number): Instant =>
  Instant.fromEpochMilliseconds(storedInstant.epochMilliseconds + hours * MILLISECONDS_PER_HOUR)

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

const libraryLevelOne: LibraryLevel = {
  building: 'library',
  level: 1,
  cost: { wood: 120, stone: 160, iron: 40, gold: 0, food: 0 },
  durationSeconds: 300,
  peasantOccupancy: 1,
}

const sawmillLevel = (level: number): ProducerLevel => ({
  building: 'sawmill',
  level,
  cost: { wood: 60, stone: 15, iron: 0, gold: 0, food: 10 },
  durationSeconds: 7_200,
  peasantOccupancy: level,
  ratePerHour: 30 * level,
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

const catalog: BuildingCatalog = {
  levelOf: (building, level) => {
    if (building === 'library' && level === 1) {
      return libraryLevelOne
    }
    if (building === 'sawmill' && level >= 1 && level <= 2) {
      return sawmillLevel(level)
    }
    return undefined
  },
  artLevelOf: (art, level) => (art === 'smithing' && level === 1 ? smithingLevelOne : undefined),
  fiefSettings: () => fiefSettings,
}

const levelsWithLibrary: FiefBuildingLevels = {
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
  library: 1,
  barracks: 0,
}

const studyCost: Stocks = smithingLevelOne.cost

const smithingInProgress: BusyStudySlot = {
  kind: 'busy',
  art: 'smithing',
  targetLevel: 1,
  startedAt: storedInstant,
  finishesAt: hoursAfterStored(2),
  cost: studyCost,
}

const storedFief = (overrides: Partial<StoredFief>): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'lord',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 3, plot: 1 },
    stocks: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    storedAt: storedInstant,
    buildingLevels: levelsWithLibrary,
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 0, cavalry: 0 },
    slot: { kind: 'idle' },
    buildQueue: [],
    studySlot: smithingInProgress,
    recruitOrder: { kind: 'idle' },
    march: { kind: 'idle' },
    ...overrides,
  })
  assert(restored.ok)
  return restored.value
}

describe('cancelStudy', () => {
  it('refunds the full cost the study slot stored', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing', targetLevel: 1 },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.stocks).toEqual({
      wood: 140,
      stone: 130,
      iron: 150,
      gold: 120,
      food: 100,
    })
  })

  it('keeps a study refund that exceeds the capacity', async () => {
    const nearlyFullFief = storedFief({
      stocks: { wood: 990, stone: 995, iron: 1000, gold: 100, food: 1000 },
    })
    const fiefs = inMemoryFiefRepository([nearlyFullFief])

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing', targetLevel: 1 },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.stocks).toEqual({
      wood: 1030,
      stone: 1025,
      iron: 1050,
      gold: 120,
      food: 1000,
    })
  })

  it('frees the study slot and stamps the fief at the cancel instant', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const cancelInstant = hoursAfterStored(1)

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing', targetLevel: 1 },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(cancelInstant) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
    expect(stored?.studySlot).toEqual({ kind: 'idle' })
    expect(stored?.storedAt).toBe(cancelInstant)
    expect(stored?.artLevels).toEqual({ smithing: 0, masonry: 0 })
    expect(stored?.stocks).toEqual({ wood: 150, stone: 140, iron: 165, gold: 122, food: 110 })
  })

  it('leaves the build slot and the build queue untouched', async () => {
    const sawmillInProgress: BusySlot = {
      kind: 'busy',
      building: 'sawmill',
      targetLevel: 1,
      startedAt: storedInstant,
      finishesAt: hoursAfterStored(2),
      cost: sawmillLevel(1).cost,
    }
    const sawmillLevelTwoWaiting = {
      building: 'sawmill',
      targetLevel: 2,
      durationSeconds: 7_200,
      cost: sawmillLevel(2).cost,
    } as const
    const fiefs = inMemoryFiefRepository([
      storedFief({ slot: sawmillInProgress, buildQueue: [sawmillLevelTwoWaiting] }),
    ])

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing', targetLevel: 1 },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(storedInstant) },
    )

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
    expect(stored?.slot).toEqual(sawmillInProgress)
    expect(stored?.buildQueue).toEqual([sawmillLevelTwoWaiting])
  })

  it('refuses to cancel with the study slot idle', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ studySlot: { kind: 'idle' } })])

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing', targetLevel: 1 },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'StudyNotFound', art: 'smithing', targetLevel: 1 }))
  })

  it('refuses to cancel a study of another art', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'masonry', targetLevel: 1 },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'StudyNotFound', art: 'masonry', targetLevel: 1 }))
  })

  it('refuses to cancel another level of the art in study', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing', targetLevel: 2 },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'StudyNotFound', art: 'smithing', targetLevel: 2 }))
  })

  it('refuses to cancel a study that has finished', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing', targetLevel: 1 },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog,
        clock: frozenClock(smithingInProgress.finishesAt),
      },
    )

    expect(result).toEqual(err({ kind: 'StudyNotFound', art: 'smithing', targetLevel: 1 }))
  })

  it('writes nothing when it refuses', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const before = JSON.stringify(fiefs.storedFiefOf('fief-1'))

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'masonry', targetLevel: 1 },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(hoursAfterStored(1)) },
    )

    assert(!result.ok)
    expect(JSON.stringify(fiefs.storedFiefOf('fief-1'))).toBe(before)
  })

  it('refuses an unknown fief', async () => {
    const fiefs = inMemoryFiefRepository([])

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'unknown-fief', art: 'smithing', targetLevel: 1 },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'FiefNotFound', fiefId: 'unknown-fief' }))
  })

  it('answers the cancelled study with its refund at the cancel instant', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const cancelInstant = hoursAfterStored(1)

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing', targetLevel: 1 },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(cancelInstant) },
    )

    assert(result.ok)
    expect(result.value.events).toEqual([
      {
        kind: 'studyCancelled',
        art: 'smithing',
        level: 1,
        occurredAt: cancelInstant,
        refund: { wood: 40, stone: 30, iron: 50, gold: 20, food: 0 },
      },
    ])
  })

  it('answers no event when the cancel is refused', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'masonry', targetLevel: 1 },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'StudyNotFound', art: 'masonry', targetLevel: 1 }))
  })

  it('records the cancel it applied through the chronicle', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const chronicle = inMemoryChronicle()
    const cancelInstant = hoursAfterStored(1)

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing', targetLevel: 1 },
      { fiefs, chronicle, catalog, clock: frozenClock(cancelInstant) },
    )

    assert(result.ok)
    expect(chronicle.recordedEventsOf('fief-1')).toEqual([
      {
        kind: 'studyCancelled',
        art: 'smithing',
        level: 1,
        occurredAt: cancelInstant,
        refund: { wood: 40, stone: 30, iron: 50, gold: 20, food: 0 },
      },
    ])
  })

  it('records nothing when the cancel is refused', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const chronicle = inMemoryChronicle()

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'masonry', targetLevel: 1 },
      { fiefs, chronicle, catalog, clock: frozenClock(storedInstant) },
    )

    assert(!result.ok)
    expect(chronicle.recordedEventsOf('fief-1')).toEqual([])
  })

  it('reports a record the chronicle refuses', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const refusal = { kind: 'FiefNotFound', fiefId: 'fief-1' } as const

    const result = await cancelStudy(
      { playerId: 'lord', fiefId: 'fief-1', art: 'smithing', targetLevel: 1 },
      {
        fiefs,
        chronicle: refusingChronicle(refusal),
        catalog,
        clock: frozenClock(hoursAfterStored(1)),
      },
    )

    expect(result).toEqual({ ok: false, error: refusal })
  })
})
