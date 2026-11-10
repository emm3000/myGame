import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { plainTownLevels, plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { type TownShape, townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { BuildingLevel } from './BuildingLevel'
import { derivePeople } from './derivePeople'
import type { HireKind } from './HireKind'
import type { HiringOrder } from './HiringOrder'
import { placeHiringOrder } from './placeHiringOrder'
import type { TownCatalog } from './TownCatalog'
import type { TownSettings } from './TownSettings'

const MILLISECONDS_PER_MINUTE = 60_000

const minutesAfterEpoch = (minutes: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + minutes * MILLISECONDS_PER_MINUTE,
  )

const storedAt = minutesAfterEpoch(60)

const frozenClock = (at: Instant): Clock => ({ now: () => at })

const richStocks = { money: 1000, food: 1000, power: 1000, material: 1000 }

const officeLevelThree: BuildingLevel = {
  building: 'office',
  level: 3,
  cost: { money: 0, food: 0, power: 0, material: 0 },
  durationSeconds: 180,
  people: 15,
  hires: ['worker', 'truck'],
}

const plainCatalog = townCatalogOf(plainTownSettings, [...plainTownLevels, officeLevelThree])

const officeTown = (shape: Partial<TownShape> = {}): ReturnType<typeof townOf> =>
  townOf({
    stocks: richStocks,
    storedAt,
    buildingLevels: { homes: 2, office: 1 },
    ...shape,
  })

const placeIn = (
  town: ReturnType<typeof townOf>,
  hire: HireKind,
  count: number,
  catalog: TownCatalog = plainCatalog,
): ReturnType<typeof placeHiringOrder> =>
  placeHiringOrder(
    { playerId: town.playerId, hire, count },
    {
      towns: inMemoryTowns([town]),
      news: inMemoryTownNews(),
      catalog,
      clock: frozenClock(storedAt),
    },
  )

const busyWorkers: HiringOrder = {
  kind: 'busy',
  hire: 'worker',
  count: 3,
  costPerHire: { money: 20, food: 10, power: 0, material: 0 },
  secondsPerHire: 60,
  startedAt: storedAt,
}

describe('placeHiringOrder', () => {
  it('places one hiring order at a time', async () => {
    const placed = await placeIn(officeTown({ hiringSlot: busyWorkers }), 'worker', 1)

    expect(placed).toEqual({ ok: false, error: { kind: 'HiringSlotBusy', hire: 'worker' } })
  })

  it('charges and staffs the whole order at the order', async () => {
    const placed = await placeIn(officeTown(), 'worker', 3)

    assert(placed.ok)
    const people = derivePeople(
      placed.value.buildingLevels,
      placed.value.staffedHires,
      plainCatalog,
    )
    assert(people.ok)
    expect([placed.value.stocks, placed.value.hiresAt(storedAt), people.value.occupied]).toEqual([
      { money: 940, food: 970, power: 1000, material: 1000 },
      { worker: 0, truck: 0 },
      12,
    ])
  })

  it('hires workers from office level 1 and trucks from level 3', async () => {
    const outcomes = await Promise.all([
      placeIn(officeTown({ buildingLevels: { homes: 2, office: 0 } }), 'worker', 1),
      placeIn(officeTown({ buildingLevels: { homes: 2, office: 1 } }), 'worker', 1),
      placeIn(officeTown({ buildingLevels: { homes: 2, office: 2 } }), 'truck', 1),
      placeIn(officeTown({ buildingLevels: { homes: 2, office: 3 } }), 'truck', 1),
    ])

    expect(outcomes.map((outcome) => (outcome.ok ? 'placed' : outcome.error))).toEqual([
      { kind: 'OfficeTooLow', hire: 'worker', requiredOfficeLevel: 1, officeLevel: 0 },
      'placed',
      { kind: 'OfficeTooLow', hire: 'truck', requiredOfficeLevel: 3, officeLevel: 2 },
      'placed',
    ])
  })

  it("fixes each hire's duration with the season's hire percent at the order", async () => {
    const springHires: TownSettings = {
      ...plainTownSettings,
      seasons: {
        ...plainTownSettings.seasons,
        durationPercent: {
          ...plainTownSettings.seasons.durationPercent,
          spring: { build: 100, study: 100, hire: 75 },
        },
      },
    }
    const catalog = townCatalogOf(springHires, plainTownLevels)

    const placed = await placeIn(officeTown(), 'worker', 4, catalog)

    assert(placed.ok)
    expect(placed.value.hiringSlot).toEqual({
      kind: 'busy',
      hire: 'worker',
      count: 4,
      costPerHire: { money: 20, food: 10, power: 0, material: 0 },
      secondsPerHire: 45,
      startedAt: storedAt,
    })
  })

  it('divides the duration by one plus the built office level', async () => {
    const placed = await placeIn(
      officeTown({ buildingLevels: { homes: 2, office: 2 } }),
      'worker',
      1,
    )

    assert(placed.ok && placed.value.hiringSlot.kind === 'busy')
    expect(placed.value.hiringSlot.secondsPerHire).toBe(40)
  })

  it('refuses a count that is not a whole number from 1', async () => {
    const outcomes = await Promise.all([
      placeIn(officeTown(), 'worker', 0),
      placeIn(officeTown(), 'worker', 1.5),
    ])

    expect(outcomes).toEqual([
      { ok: false, error: { kind: 'InvalidHireCount', hire: 'worker', count: 0 } },
      { ok: false, error: { kind: 'InvalidHireCount', hire: 'worker', count: 1.5 } },
    ])
  })

  it('bounds the order by the lowest free people across the building work', async () => {
    const homesRaise = {
      kind: 'busy' as const,
      building: 'homes' as const,
      level: 2,
      cost: { money: 0, food: 0, power: 0, material: 0 },
      startedAt: storedAt,
      finishesAt: minutesAfterEpoch(120),
    }
    const town = officeTown({ buildingLevels: { homes: 1, office: 1 }, workSlot: homesRaise })

    const placed = await placeIn(town, 'worker', 22)

    expect(placed).toEqual({
      ok: false,
      error: { kind: 'NotEnoughPeople', requiredPeople: 22, freePeople: 21 },
    })
  })

  it('refuses an order the stocks cannot pay', async () => {
    const placed = await placeIn(
      officeTown({ stocks: { money: 50, food: 0, power: 0, material: 0 } }),
      'worker',
      3,
    )

    expect(placed).toEqual({
      ok: false,
      error: {
        kind: 'NotEnoughResources',
        missing: { money: 10, food: 30, power: 0, material: 0 },
      },
    })
  })

  it('saves the placed order', async () => {
    const town = officeTown()
    const towns = inMemoryTowns([town])

    await placeHiringOrder(
      { playerId: town.playerId, hire: 'worker', count: 2 },
      { towns, news: inMemoryTownNews(), catalog: plainCatalog, clock: frozenClock(storedAt) },
    )

    expect(towns.storedTownOf(town.playerId)?.hiringSlot).toMatchObject({
      hire: 'worker',
      count: 2,
    })
  })
})
