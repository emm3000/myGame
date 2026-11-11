import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryCleanUps } from '../testing/inMemoryCleanUps'
import { inMemoryRegionMap } from '../testing/inMemoryRegionMap'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { type TownShape, townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import { accrueTown } from './accrueTown'
import type { CleanUpOrder } from './CleanUpOrder'
import type { CleanUpRepository } from './CleanUpRepository'
import { callJobBack } from './callJobBack'
import type { Hires } from './Hires'
import type { Job } from './Job'
import { resolveTown } from './resolveTown'
import type { Stocks } from './Stocks'
import { sendCleanUp } from './sendCleanUp'
import type { Town } from './Town'

const MILLISECONDS_PER_MINUTE = 60_000

const MILLISECONDS_PER_DAY = 86_400_000

const storedAt = Instant.fromEpochMilliseconds(
  plainTownSettings.seasons.epoch.epochMilliseconds + MILLISECONDS_PER_DAY,
)

const minutesAfterStored = (minutes: number): Instant =>
  Instant.fromEpochMilliseconds(storedAt.epochMilliseconds + minutes * MILLISECONDS_PER_MINUTE)

const sentAt = minutesAfterStored(60)

const arrivesAt = minutesAfterStored(70)

const returnsAt = minutesAfterStored(80)

const frozenClock = (at: Instant): Clock => ({ now: () => at })

const catalog = townCatalogOf()

const smallWasteSite = { area: 2, site: 1 }

const siteWithoutWaste = { area: 2, site: 3 }

const sixWorkers: Hires = { worker: 6, truck: 0 }

const fiveWorkers: Hires = { worker: 5, truck: 0 }

const homeTown = (shape: Partial<TownShape> = {}): Town =>
  townOf({
    stocks: { money: 100, food: 100, power: 100, material: 100 },
    storedAt,
    hires: { worker: 8, truck: 2 },
    ...shape,
  })

const neighborTown = townOf({
  id: 'town-2',
  playerId: 'player-2',
  name: 'Cedar Creek',
  area: 1,
  site: 9,
  storedAt,
})

const order = (change: Partial<CleanUpOrder> = {}): CleanUpOrder => ({
  playerId: 'player-1',
  site: smallWasteSite,
  team: sixWorkers,
  ...change,
})

type World = {
  readonly towns: ReturnType<typeof inMemoryTowns>
  readonly news: ReturnType<typeof inMemoryTownNews>
  readonly cleanUps: CleanUpRepository
}

const worldOf = (town: Town = homeTown()): World => ({
  towns: inMemoryTowns([town, neighborTown]),
  news: inMemoryTownNews(),
  cleanUps: inMemoryCleanUps(),
})

const sendIn = (
  world: World,
  change: Partial<CleanUpOrder> = {},
  at: Instant = sentAt,
): ReturnType<typeof sendCleanUp> =>
  sendCleanUp(order(change), {
    ...world,
    map: inMemoryRegionMap([homeTown(), neighborTown]),
    catalog,
    clock: frozenClock(at),
  })

const resolveIn = async (world: World, at: Instant): Promise<Town> => {
  const resolved = await resolveTown('player-1', { ...world, catalog, clock: frozenClock(at) })
  assert(resolved.ok)
  return resolved.value.town
}

const callBackIn = (world: World, at: Instant): ReturnType<typeof callJobBack> =>
  callJobBack({ playerId: 'player-1', sentAt }, { ...world, catalog, clock: frozenClock(at) })

const sentJobOf = (sent: Awaited<ReturnType<typeof sendCleanUp>>): Job => {
  assert(sent.ok && sent.value.jobSlot.kind === 'out')
  return sent.value.jobSlot
}

const stocksAt = (town: Town, at: Instant): Stocks => {
  const accrual = accrueTown(town, catalog, at)
  assert(accrual.ok)
  return accrual.value.stocks
}

const stocksGainedBy = async (team: Hires, at: Instant = returnsAt): Promise<Stocks> => {
  const world = worldOf()
  await sendIn(world, { team })
  const returned = stocksAt(await resolveIn(world, at), at)
  const idle = stocksAt(homeTown(), at)
  return {
    money: returned.money - idle.money,
    food: returned.food - idle.food,
    power: returned.power - idle.power,
    material: returned.material - idle.material,
  }
}

describe('sendCleanUp', () => {
  it("fixes the site's size, its waste and the team's strength at dispatch", async () => {
    const sent = await sendIn(worldOf(), { team: { worker: 3, truck: 1 } })

    expect(sentJobOf(sent).cleanUp).toEqual({ size: 1, waste: 6, strength: 6, hasArrived: false })
  })

  it("times the road as a job's and stays no hour at the site", async () => {
    const job = sentJobOf(await sendIn(worldOf()))

    expect([job.hours, job.oneWaySeconds, job.sentAt]).toEqual([0, 600, sentAt])
  })

  it("cleans a site whose waste the team's strength covers", async () => {
    const world = worldOf()
    await sendIn(world)
    await resolveIn(world, arrivesAt)

    expect(world.news.recordedEventsOf('town-1').map((event) => event.kind)).toEqual([
      'cleanUpDone',
    ])
  })

  it('pays money and material per point of waste at the return', async () => {
    expect([await stocksGainedBy(sixWorkers, arrivesAt), await stocksGainedBy(sixWorkers)]).toEqual(
      [
        { money: 0, food: 0, power: 0, material: 0 },
        { money: 12, food: 0, power: 0, material: 18 },
      ],
    )
  })

  it('caps the pay at the share of the summed carry', async () => {
    const sent = await sendCleanUp(order(), {
      ...worldOf(),
      map: inMemoryRegionMap([homeTown(), neighborTown]),
      catalog: townCatalogOf({
        ...plainTownSettings,
        waste: { ...plainTownSettings.waste, materialPerPoint: 60 },
      }),
      clock: frozenClock(sentAt),
    })

    expect(sentJobOf(sent).pay).toEqual({ money: 12, food: 0, power: 0, material: 150 })
  })

  it("starts the site's waste again from 0", async () => {
    const world = worldOf()
    await sendIn(world)
    await resolveIn(world, returnsAt)
    const twoHoursAfterArrival = minutesAfterStored(190)

    const again = await sendIn(world, {}, twoHoursAfterArrival)

    expect(sentJobOf(again).cleanUp?.waste).toBe(2)
  })

  it('brings nothing back from a site the team cannot clean', async () => {
    expect(await stocksGainedBy(fiveWorkers)).toEqual({ money: 0, food: 0, power: 0, material: 0 })
  })

  it('leaves the waste of a site the team cannot clean', async () => {
    const world = worldOf()
    await sendIn(world, { team: fiveWorkers })
    await resolveIn(world, returnsAt)

    const again = await sendIn(world, {}, minutesAfterStored(90))

    expect(sentJobOf(again).cleanUp?.waste).toBe(6)
  })

  it('loses no hire', async () => {
    const world = worldOf()
    await sendIn(world, { team: fiveWorkers })

    const returned = await resolveIn(world, returnsAt)

    expect([returned.hires, returned.hiresAtHomeAt(returnsAt)]).toEqual([
      { worker: 8, truck: 2 },
      { worker: 8, truck: 2 },
    ])
  })

  it('writes the clean-up done and failed events', async () => {
    const cleaning = worldOf()
    const failing = worldOf()
    await sendIn(cleaning)
    await sendIn(failing, { team: fiveWorkers })
    await resolveIn(cleaning, returnsAt)
    await resolveIn(failing, returnsAt)
    const site = { region: 1, ...smallWasteSite }

    expect([
      cleaning.news.recordedEventsOf('town-1')[0],
      failing.news.recordedEventsOf('town-1')[0],
    ]).toEqual([
      {
        kind: 'cleanUpDone',
        site,
        reward: { money: 12, food: 0, power: 0, material: 18 },
        occurredAt: arrivesAt,
      },
      { kind: 'cleanUpFailed', site, occurredAt: arrivesAt },
    ])
  })

  it('writes the team back at the return', async () => {
    const world = worldOf()
    await sendIn(world)
    await resolveIn(world, arrivesAt)
    await resolveIn(world, returnsAt)

    expect(world.news.recordedEventsOf('town-1').map((event) => event.kind)).toEqual([
      'cleanUpDone',
      'jobBack',
    ])
  })

  it('leaves the waste of a site whose team is called back on the way out', async () => {
    const world = worldOf()
    await sendIn(world)
    await callBackIn(world, minutesAfterStored(65))
    await resolveIn(world, minutesAfterStored(70))

    const again = await sendIn(world, {}, minutesAfterStored(75))

    expect(sentJobOf(again).cleanUp?.waste).toBe(6)
  })

  it('writes no clean-up for a team called back on the way out', async () => {
    const world = worldOf()
    await sendIn(world)
    await callBackIn(world, minutesAfterStored(65))
    await resolveIn(world, returnsAt)

    expect(world.news.recordedEventsOf('town-1').map((event) => event.kind)).toEqual([
      'jobCalledBack',
    ])
  })

  it('refuses a call back once the team reached the site', async () => {
    const world = worldOf()
    await sendIn(world)

    expect(await callBackIn(world, arrivesAt)).toEqual({
      ok: false,
      error: { kind: 'JobAlreadyReturning' },
    })
  })

  it('refuses a site that holds no waste', async () => {
    const sent = await sendIn(worldOf(), { site: siteWithoutWaste })

    expect(sent).toEqual({ ok: false, error: { kind: 'NotAWasteSite', area: 2, site: 3 } })
  })

  it('refuses a waste site whose waste has not regrown since its clean-up', async () => {
    const world = worldOf()
    await sendIn(world)
    await resolveIn(world, returnsAt)

    const again = await sendIn(world, {}, minutesAfterStored(90))

    expect(again).toEqual({ ok: false, error: { kind: 'NoWasteYet', area: 2, site: 1 } })
  })

  it('refuses a site a town holds', async () => {
    const sent = await sendIn(worldOf(), { site: { area: 1, site: 9 } })

    expect(sent).toEqual({ ok: false, error: { kind: 'SiteHeld', area: 1, site: 9 } })
  })

  it("refuses the town's own site", async () => {
    const sent = await sendIn(worldOf(), { site: { area: 1, site: 1 } })

    expect(sent).toEqual({ ok: false, error: { kind: 'JobToOwnSite' } })
  })

  it('refuses a site outside the map', async () => {
    const sent = await sendIn(worldOf(), { site: { area: 3, site: 1 } })

    expect(sent).toEqual({ ok: false, error: { kind: 'JobSiteOutOfBounds', area: 3, site: 1 } })
  })

  it('refuses an empty team', async () => {
    const team = { worker: 0, truck: 0 }

    expect(await sendIn(worldOf(), { team })).toEqual({
      ok: false,
      error: { kind: 'InvalidTeam', team },
    })
  })

  it('refuses a second team while one is out', async () => {
    const world = worldOf()
    await sendIn(world, { team: { worker: 1, truck: 0 } })

    const second = await sendIn(world, { team: { worker: 1, truck: 0 } }, minutesAfterStored(61))

    expect(second).toEqual({ ok: false, error: { kind: 'TeamAlreadyOut' } })
  })

  it('refuses a team larger than the hires at home', async () => {
    const sent = await sendIn(worldOf(), { team: { worker: 9, truck: 0 } })

    expect(sent).toEqual({
      ok: false,
      error: { kind: 'NotEnoughHiresAtHome', hire: 'worker', count: 9, atHome: 8 },
    })
  })
})
