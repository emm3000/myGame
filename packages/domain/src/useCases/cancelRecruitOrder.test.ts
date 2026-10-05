import { assert, describe, expect, it } from 'vitest'
import type { BusySlot } from '../fief/BuildSlot'
import { derivePeasantCounts } from '../fief/derivePeasantCounts'
import { Fief, type StoredFief } from '../fief/Fief'
import type { FiefBuildingLevels } from '../fief/FiefBuildingLevels'
import type { OpenRecruitOrder } from '../fief/RecruitOrder'
import type { BusyStudySlot } from '../fief/StudySlot'
import type {
  BarracksLevel,
  BuildingCatalog,
  FarmLevel,
  FiefSettings,
} from '../ports/BuildingCatalog'
import type { Clock } from '../ports/Clock'
import { err } from '../Result'
import { inMemoryChronicle } from '../testing/inMemoryChronicle'
import {
  type InMemoryFiefRepository,
  inMemoryFiefRepository,
} from '../testing/inMemoryFiefRepository'
import { neutralSeasons } from '../testing/neutralSeasons'
import { plainCamps } from '../testing/plainCamps'
import { plainForage } from '../testing/plainForage'
import { plainUnits } from '../testing/plainUnits'
import { refusingChronicle } from '../testing/refusingChronicle'
import { Instant } from '../time/Instant'
import { cancelRecruitOrder } from './cancelRecruitOrder'

const MILLISECONDS_PER_SECOND = 1_000

const storedInstant = Instant.fromEpochMilliseconds(86_400_000)

const secondsAfterStored = (seconds: number): Instant =>
  Instant.fromEpochMilliseconds(storedInstant.epochMilliseconds + seconds * MILLISECONDS_PER_SECOND)

const frozenClock = (instant: Instant): Clock => ({ now: () => instant })

const fiefSettings: FiefSettings = {
  startingStocks: { wood: 500, stone: 500, iron: 200, gold: 50, food: 300 },
  startingCapacity: 1000,
  basePeasantSupply: 6,
  plotsPerProvince: 15,
  baseRates: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  terrainBonus: {
    lowlands: { resource: 'food', ratePerHour: 0 },
    uplands: { resource: 'stone', ratePerHour: 0 },
    ridges: { resource: 'iron', ratePerHour: 0 },
  },
  buildQueueCap: 4,
  fiefCap: 2,
  units: plainUnits,
  forage: plainForage,
  camps: plainCamps,
  seasons: neutralSeasons,
}

const barracksLevel = (level: number): BarracksLevel => ({
  building: 'barracks',
  level,
  cost: { wood: 150, stone: 100, iron: 30, gold: 0, food: 0 },
  durationSeconds: 400,
  peasantOccupancy: level,
})

const farmLevel = (level: number): FarmLevel => ({
  building: 'farm',
  level,
  cost: { wood: 40, stone: 10, iron: 0, gold: 0, food: 0 },
  durationSeconds: 120,
  peasantOccupancy: 1,
  ratePerHour: 10 * level,
  peasantSupply: 4 * level,
})

const catalog: BuildingCatalog = {
  levelOf: (building, level) => {
    if (level < 1 || level > 3) {
      return undefined
    }
    if (building === 'barracks') {
      return barracksLevel(level)
    }
    return building === 'farm' ? farmLevel(level) : undefined
  },
  artLevelOf: () => undefined,
  fiefSettings: () => fiefSettings,
}

const levelsWithBarracks: FiefBuildingLevels = {
  sawmill: 0,
  quarry: 0,
  ironMine: 0,
  farm: 0,
  warehouse: 0,
  library: 0,
  barracks: 1,
}

const fiveInfantry: OpenRecruitOrder = {
  kind: 'open',
  unit: 'infantry',
  count: 5,
  cost: { wood: 100, stone: 0, iron: 50, gold: 0, food: 150 },
  perUnitSeconds: 45,
  startedAt: storedInstant,
}

const storedFief = (overrides: Partial<StoredFief>): Fief => {
  const restored = Fief.restore({
    id: 'fief-1',
    playerId: 'lord',
    name: 'Vado Viejo',
    address: { kingdom: 1, province: 3, plot: 1 },
    stocks: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    storedAt: storedInstant,
    buildingLevels: levelsWithBarracks,
    artLevels: { smithing: 0, masonry: 0 },
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
    slot: { kind: 'idle' },
    buildQueue: [],
    studySlot: { kind: 'idle' },
    recruitOrder: fiveInfantry,
    march: { kind: 'idle' },
    ...overrides,
  })
  assert(restored.ok)
  return restored.value
}

const cancelFiveInfantryAt = (fiefs: InMemoryFiefRepository, now: Instant) =>
  cancelRecruitOrder(
    { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', startedAt: storedInstant },
    { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(now) },
  )

describe('cancelRecruitOrder', () => {
  it('keeps the units delivered by the cancel', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelFiveInfantryAt(fiefs, secondsAfterStored(100))

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
    expect(stored?.units.countOf('infantry')).toBe(2)
    expect(stored?.recruitOrder).toEqual({ kind: 'idle' })
    expect(stored?.storedAt).toEqual(secondsAfterStored(100))
  })

  it('counts a delivery at the cancel instant as delivered', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelFiveInfantryAt(fiefs, secondsAfterStored(90))

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.units.countOf('infantry')).toBe(2)
  })

  it('refunds the cost of the undelivered units only', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelFiveInfantryAt(fiefs, secondsAfterStored(90))

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.stocks).toEqual({
      wood: 160,
      stone: 100,
      iron: 130,
      gold: 100,
      food: 190,
    })
  })

  it('refunds the whole cost before the first delivery', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelFiveInfantryAt(fiefs, secondsAfterStored(44))

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
    expect(stored?.units.countOf('infantry')).toBe(0)
    expect(stored?.stocks).toEqual({ wood: 200, stone: 100, iron: 150, gold: 100, food: 250 })
  })

  it('keeps a refund that exceeds the capacity', async () => {
    const fullFief = storedFief({
      stocks: { wood: 1000, stone: 1000, iron: 990, gold: 1000, food: 950 },
    })
    const fiefs = inMemoryFiefRepository([fullFief])

    const result = await cancelFiveInfantryAt(fiefs, storedInstant)

    assert(result.ok)
    expect(fiefs.storedFiefOf('fief-1')?.stocks).toEqual({
      wood: 1100,
      stone: 1000,
      iron: 1040,
      gold: 1000,
      food: 1100,
    })
  })

  it('frees the peasants of the undelivered units', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelFiveInfantryAt(fiefs, secondsAfterStored(90))

    assert(result.ok)
    const { buildingLevels, units, recruitOrder } = result.value.fief
    expect(derivePeasantCounts(buildingLevels, units, recruitOrder, catalog)).toEqual({
      ok: true,
      value: { supplied: 6, occupied: 3, free: 3 },
    })
  })

  it('leaves the build slot, the build queue and the study slot untouched', async () => {
    const farmInProgress: BusySlot = {
      kind: 'busy',
      building: 'farm',
      targetLevel: 1,
      startedAt: storedInstant,
      finishesAt: secondsAfterStored(3_600),
      cost: farmLevel(1).cost,
    }
    const farmLevelTwoWaiting = {
      building: 'farm',
      targetLevel: 2,
      durationSeconds: 120,
      cost: farmLevel(2).cost,
    } as const
    const smithingInProgress: BusyStudySlot = {
      kind: 'busy',
      art: 'smithing',
      targetLevel: 1,
      startedAt: storedInstant,
      finishesAt: secondsAfterStored(3_600),
      cost: { wood: 40, stone: 30, iron: 50, gold: 20, food: 0 },
    }
    const fiefs = inMemoryFiefRepository([
      storedFief({
        slot: farmInProgress,
        buildQueue: [farmLevelTwoWaiting],
        studySlot: smithingInProgress,
      }),
    ])

    const result = await cancelFiveInfantryAt(fiefs, secondsAfterStored(90))

    assert(result.ok)
    const stored = fiefs.storedFiefOf('fief-1')
    expect(stored?.slot).toEqual(farmInProgress)
    expect(stored?.buildQueue).toEqual([farmLevelTwoWaiting])
    expect(stored?.studySlot).toEqual(smithingInProgress)
    expect(stored?.buildingLevels).toEqual(levelsWithBarracks)
    expect(stored?.artLevels).toEqual({ smithing: 0, masonry: 0 })
  })

  it('refuses to cancel with the recruit slot idle', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({ recruitOrder: { kind: 'idle' } })])

    const result = await cancelFiveInfantryAt(fiefs, secondsAfterStored(90))

    expect(result).toEqual(
      err({ kind: 'RecruitOrderNotFound', unit: 'infantry', startedAt: storedInstant }),
    )
  })

  it('refuses to cancel an order started at another instant', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const otherInstant = secondsAfterStored(1)

    const result = await cancelRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', startedAt: otherInstant },
      {
        fiefs,
        chronicle: inMemoryChronicle(),
        catalog,
        clock: frozenClock(secondsAfterStored(90)),
      },
    )

    expect(result).toEqual(
      err({ kind: 'RecruitOrderNotFound', unit: 'infantry', startedAt: otherInstant }),
    )
  })

  it('refuses to cancel an order that has ended', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])

    const result = await cancelFiveInfantryAt(fiefs, secondsAfterStored(225))

    expect(result).toEqual(
      err({ kind: 'RecruitOrderNotFound', unit: 'infantry', startedAt: storedInstant }),
    )
  })

  it('writes nothing when it refuses', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const chronicle = inMemoryChronicle()
    const before = JSON.stringify(fiefs.storedFiefOf('fief-1'))

    const result = await cancelRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', startedAt: secondsAfterStored(1) },
      { fiefs, chronicle, catalog, clock: frozenClock(secondsAfterStored(90)) },
    )

    assert(!result.ok)
    expect(JSON.stringify(fiefs.storedFiefOf('fief-1'))).toBe(before)
    expect(chronicle.recordedEventsOf('fief-1')).toEqual([])
  })

  it('records the units kept, the units cancelled and the refund', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const chronicle = inMemoryChronicle()

    const result = await cancelRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', startedAt: storedInstant },
      { fiefs, chronicle, catalog, clock: frozenClock(secondsAfterStored(90)) },
    )

    assert(result.ok)
    expect(chronicle.recordedEventsOf('fief-1')).toEqual([
      {
        kind: 'recruitsCancelled',
        unit: 'infantry',
        delivered: 2,
        cancelled: 3,
        occurredAt: secondsAfterStored(90),
        refund: { wood: 60, stone: 0, iron: 30, gold: 0, food: 90 },
      },
    ])
    expect(result.value.events).toEqual(chronicle.recordedEventsOf('fief-1'))
  })

  it('stamps the cancel event with the cancel instant', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const chronicle = inMemoryChronicle()
    const cancelInstant = secondsAfterStored(100)

    const result = await cancelRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', startedAt: storedInstant },
      { fiefs, chronicle, catalog, clock: frozenClock(cancelInstant) },
    )

    assert(result.ok)
    expect(chronicle.recordedEventsOf('fief-1').map((event) => event.occurredAt)).toEqual([
      cancelInstant,
    ])
  })

  it('records no event when it refuses', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const chronicle = inMemoryChronicle()

    const result = await cancelRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', startedAt: storedInstant },
      { fiefs, chronicle, catalog, clock: frozenClock(secondsAfterStored(225)) },
    )

    assert(!result.ok)
    expect(chronicle.recordedEventsOf('fief-1')).toEqual([])
  })

  it('reports a record the chronicle refuses', async () => {
    const fiefs = inMemoryFiefRepository([storedFief({})])
    const refusal = { kind: 'FiefNotFound', fiefId: 'fief-1' } as const

    const result = await cancelRecruitOrder(
      { playerId: 'lord', fiefId: 'fief-1', unit: 'infantry', startedAt: storedInstant },
      {
        fiefs,
        chronicle: refusingChronicle(refusal),
        catalog,
        clock: frozenClock(secondsAfterStored(90)),
      },
    )

    expect(result).toEqual({ ok: false, error: refusal })
  })

  it('refuses an unknown fief', async () => {
    const fiefs = inMemoryFiefRepository([])

    const result = await cancelRecruitOrder(
      { playerId: 'lord', fiefId: 'unknown-fief', unit: 'infantry', startedAt: storedInstant },
      { fiefs, chronicle: inMemoryChronicle(), catalog, clock: frozenClock(storedInstant) },
    )

    expect(result).toEqual(err({ kind: 'FiefNotFound', fiefId: 'unknown-fief' }))
  })
})
