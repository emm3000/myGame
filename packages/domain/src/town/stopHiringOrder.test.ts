import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import { derivePeople } from './derivePeople'
import type { HiringOrder } from './HiringOrder'
import { placeHiringOrder } from './placeHiringOrder'
import { resolveTown } from './resolveTown'
import { stopHiringOrder } from './stopHiringOrder'

const MILLISECONDS_PER_MINUTE = 60_000

const minutesAfterEpoch = (minutes: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + minutes * MILLISECONDS_PER_MINUTE,
  )

const storedAt = minutesAfterEpoch(60)

const frozenClock = (at: Instant): Clock => ({ now: () => at })

const catalog = townCatalogOf({ ...plainTownSettings, taxRatePerHour: 0, terrainBonusPerHour: 0 })

const workerCost = { money: 20, food: 10, power: 0, material: 0 }

const fiveWorkers: HiringOrder = {
  kind: 'busy',
  hire: 'worker',
  count: 5,
  costPerHire: workerCost,
  secondsPerHire: 60,
  startedAt: storedAt,
}

const hiringTown = (): ReturnType<typeof townOf> =>
  townOf({
    stocks: { money: 100, food: 100, power: 100, material: 100 },
    storedAt,
    buildingLevels: { homes: 2, office: 1 },
    hires: { worker: 2, truck: 0 },
    hiringSlot: fiveWorkers,
  })

const stopAt = (
  at: Instant,
  town: ReturnType<typeof townOf>,
  startedAt: Instant = storedAt,
): ReturnType<typeof stopHiringOrder> =>
  stopHiringOrder(
    { playerId: town.playerId, hire: 'worker', startedAt },
    { towns: inMemoryTowns([town]), news: inMemoryTownNews(), catalog, clock: frozenClock(at) },
  )

describe('stopHiringOrder', () => {
  it('keeps the delivered hires at a stop and refunds the rest in full', async () => {
    const stopped = await stopAt(minutesAfterEpoch(62.5), hiringTown())

    assert(stopped.ok)
    const { town } = stopped.value
    expect([town.hiresAt(minutesAfterEpoch(70)), town.hiringSlot, town.stocks]).toEqual([
      { worker: 4, truck: 0 },
      { kind: 'idle' },
      { money: 160, food: 130, power: 100, material: 100 },
    ])
  })

  it('frees the people of the stopped hires', async () => {
    const stopped = await stopAt(minutesAfterEpoch(62.5), hiringTown())

    assert(stopped.ok)
    const { town } = stopped.value
    const people = derivePeople(town.buildingLevels, town.staffedHires, catalog)
    assert(people.ok)
    expect(people.value.occupied).toBe(4 + 5 + 4)
  })

  it('refuses an order named by another start', async () => {
    const stopped = await stopAt(minutesAfterEpoch(62), hiringTown(), minutesAfterEpoch(61))

    expect(stopped).toEqual({
      ok: false,
      error: { kind: 'HiringOrderNotFound', hire: 'worker', startedAt: minutesAfterEpoch(61) },
    })
  })

  it('refuses an order already delivered in full', async () => {
    const stopped = await stopAt(minutesAfterEpoch(65), hiringTown())

    expect(stopped).toEqual({
      ok: false,
      error: { kind: 'HiringOrderNotFound', hire: 'worker', startedAt: storedAt },
    })
  })

  it('writes the delivered and stopped events', async () => {
    const town = townOf({
      stocks: { money: 1000, food: 1000, power: 0, material: 0 },
      storedAt,
      buildingLevels: { homes: 2, office: 1 },
      hiringSlot: fiveWorkers,
    })
    const towns = inMemoryTowns([town])
    const news = inMemoryTownNews()
    const deliveredAt = minutesAfterEpoch(65)
    const dependencies = { towns, news, catalog, clock: frozenClock(minutesAfterEpoch(66)) }
    await resolveTown(town.playerId, dependencies)
    await placeHiringOrder({ playerId: town.playerId, hire: 'worker', count: 3 }, dependencies)
    const stopAtMinute = minutesAfterEpoch(67)

    await stopHiringOrder(
      { playerId: town.playerId, hire: 'worker', startedAt: minutesAfterEpoch(66) },
      { ...dependencies, clock: frozenClock(stopAtMinute) },
    )

    expect(news.recordedEventsOf(town.id)).toEqual([
      { kind: 'hiringDelivered', hire: 'worker', count: 5, occurredAt: deliveredAt },
      {
        kind: 'hiringStopped',
        hire: 'worker',
        delivered: 1,
        stopped: 2,
        refund: { money: 40, food: 20, power: 0, material: 0 },
        occurredAt: stopAtMinute,
      },
    ])
  })
})
