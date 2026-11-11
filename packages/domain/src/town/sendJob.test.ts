import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryRegionMap } from '../testing/inMemoryRegionMap'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { type TownShape, townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { Hires } from './Hires'
import type { Job } from './Job'
import type { JobOrder } from './JobOrder'
import { sendJob } from './sendJob'
import type { Town } from './Town'
import type { TownCatalog } from './TownCatalog'
import type { JobTerms, TownSettings } from './TownSettings'

const MILLISECONDS_PER_DAY = 86_400_000

const daysAfterEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + days * MILLISECONDS_PER_DAY,
  )

const storedAt = daysAfterEpoch(1)

const sentAt = daysAfterEpoch(2)

const frozenClock = (at: Instant): Clock => ({ now: () => at })

const stocks = { money: 100, food: 100, power: 100, material: 100 }

const crew: Hires = { worker: 4, truck: 1 }

const homeTown = (shape: Partial<TownShape> = {}): Town =>
  townOf({ stocks, storedAt, hires: { worker: 6, truck: 2 }, ...shape })

const neighborTown = townOf({
  id: 'town-2',
  playerId: 'player-2',
  name: 'Cedar Creek',
  area: 1,
  site: 9,
  storedAt,
})

const plainCatalog = townCatalogOf()

const catalogWithJob = (job: Partial<JobTerms>): TownCatalog =>
  townCatalogOf({ ...plainTownSettings, job: { ...plainTownSettings.job, ...job } })

const command = (change: Partial<JobOrder> = {}): JobOrder => ({
  playerId: 'player-1',
  site: { area: 2, site: 4 },
  team: crew,
  hours: 2,
  ...change,
})

const sendFrom = async (
  town: Town,
  change: Partial<JobOrder> = {},
  catalog: TownCatalog = plainCatalog,
  at: Instant = sentAt,
): Promise<{
  readonly sent: Awaited<ReturnType<typeof sendJob>>
  readonly towns: ReturnType<typeof inMemoryTowns>
}> => {
  const towns = inMemoryTowns([town, neighborTown])
  const sent = await sendJob(command(change), {
    towns,
    map: inMemoryRegionMap([town, neighborTown]),
    news: inMemoryTownNews(),
    catalog,
    clock: frozenClock(at),
  })
  return { sent, towns }
}

const outcomeOf = ({ sent }: Awaited<ReturnType<typeof sendFrom>>): unknown =>
  sent.ok ? 'sent' : sent.error

const jobOf = (sent: Awaited<ReturnType<typeof sendJob>>): Job => {
  assert(sent.ok && sent.value.jobSlot.kind === 'out')
  return sent.value.jobSlot
}

const outJob: Job = {
  kind: 'out',
  site: { region: 1, area: 2, site: 4 },
  team: { worker: 1, truck: 0 },
  hours: 1,
  sentAt,
  oneWaySeconds: 600,
  pay: { money: 0, food: 0, power: 3, material: 3 },
  payPercent: { money: 100, food: 100, power: 100, material: 100 },
}

describe('sendJob', () => {
  it("sends a team to a free site for whole hours from 1 to the content's maximum", async () => {
    const outcomes = await Promise.all(
      [1, 8, 0, 9, 1.5].map((hours) => sendFrom(homeTown(), { hours })),
    )

    expect(outcomes.map(outcomeOf)).toEqual([
      'sent',
      'sent',
      { kind: 'JobHoursOutOfRange', hours: 0, maxHours: 8 },
      { kind: 'JobHoursOutOfRange', hours: 9, maxHours: 8 },
      { kind: 'JobHoursOutOfRange', hours: 1.5, maxHours: 8 },
    ])
  })

  it('stores the job and leaves the stocks and the stored instant as they were', async () => {
    const { towns } = await sendFrom(homeTown())

    const stored = towns.storedTownOf('player-1')
    assert(stored !== undefined)
    expect([stored.jobSlot, stored.stocks, stored.storedAt]).toEqual([
      {
        kind: 'out',
        site: { region: 1, area: 2, site: 4 },
        team: crew,
        hours: 2,
        sentAt,
        oneWaySeconds: 780,
        pay: { money: 0, food: 0, power: 30, material: 30 },
        payPercent: { money: 100, food: 100, power: 100, material: 100 },
      },
      stocks,
      storedAt,
    ])
  })

  it('fixes the pay at dispatch from terrain, hours, team and carry', async () => {
    const richFields = catalogWithJob({
      payPerHour: {
        ...plainTownSettings.job.payPerHour,
        fields: { money: 0, food: 30, power: 0, material: 2 },
      },
    })
    const outcomes = await Promise.all([
      sendFrom(homeTown(), { site: { area: 2, site: 4 }, hours: 2 }),
      sendFrom(homeTown(), { site: { area: 1, site: 5 }, hours: 3 }),
      sendFrom(homeTown(), { site: { area: 1, site: 5 }, hours: 8 }, richFields),
      sendFrom(homeTown(), { site: { area: 1, site: 5 }, team: { worker: 1, truck: 0 } }),
    ])

    expect(outcomes.map(({ sent }) => jobOf(sent).pay)).toEqual([
      { money: 0, food: 0, power: 30, material: 30 },
      { money: 0, food: 45, power: 0, material: 45 },
      { money: 0, food: 200, power: 0, material: 80 },
      { money: 0, food: 6, power: 0, material: 6 },
    ])
  })

  it('never pays money from a job', async () => {
    const moneyFields = catalogWithJob({
      payPerHour: {
        ...plainTownSettings.job.payPerHour,
        fields: { money: 10, food: 3, power: 0, material: 0 },
      },
    })

    const { sent } = await sendFrom(homeTown(), { site: { area: 1, site: 5 } }, moneyFields)

    expect(jobOf(sent).pay).toEqual({ money: 0, food: 30, power: 0, material: 0 })
  })

  it("takes the road of the team's slowest kind", async () => {
    const outcomes = await Promise.all([
      sendFrom(homeTown(), { team: { worker: 0, truck: 2 } }),
      sendFrom(homeTown(), { team: { worker: 1, truck: 2 } }),
    ])

    expect(outcomes.map(({ sent }) => jobOf(sent).oneWaySeconds)).toEqual([390, 780])
  })

  it("scales the road by the season's road percent at dispatch", async () => {
    const slowFall: TownSettings = {
      ...plainTownSettings,
      seasons: {
        ...plainTownSettings.seasons,
        durationPercent: {
          ...plainTownSettings.seasons.durationPercent,
          fall: { build: 100, study: 100, hire: 100, road: 75 },
        },
      },
    }
    const catalog = townCatalogOf(slowFall)
    const inFall = daysAfterEpoch(15)
    const outcomes = await Promise.all([
      sendFrom(homeTown(), {}, catalog, sentAt),
      sendFrom(homeTown(), {}, catalog, inFall),
      sendFrom(homeTown(), { team: { worker: 0, truck: 1 } }, catalog, inFall),
    ])

    expect(outcomes.map(({ sent }) => jobOf(sent).oneWaySeconds)).toEqual([780, 585, 293])
  })

  it("fixes the season's production percent as the pay percent at dispatch", async () => {
    const thinSpring: TownSettings = {
      ...plainTownSettings,
      seasons: {
        ...plainTownSettings.seasons,
        productionPercent: {
          ...plainTownSettings.seasons.productionPercent,
          spring: { money: 100, food: 100, power: 50, material: 100 },
        },
      },
    }

    const { sent } = await sendFrom(homeTown(), {}, townCatalogOf(thinSpring))

    expect([jobOf(sent).payPercent.power, jobOf(sent).pay]).toEqual([
      50,
      { money: 0, food: 0, power: 15, material: 30 },
    ])
  })

  it('refuses a team with a negative or fractional count, or no hire at all', async () => {
    const teams: ReadonlyArray<Hires> = [
      { worker: -1, truck: 2 },
      { worker: 1.5, truck: 0 },
      { worker: 0, truck: 0 },
    ]
    const outcomes = await Promise.all(
      teams.map((team) => sendFrom(homeTown({ jobSlot: outJob }), { team, hours: 0 })),
    )

    expect(outcomes.map(outcomeOf)).toEqual(teams.map((team) => ({ kind: 'InvalidTeam', team })))
  })

  it('refuses the hours before a team already out', async () => {
    const outcome = await sendFrom(homeTown({ jobSlot: outJob }), { hours: 9 })

    expect(outcomeOf(outcome)).toEqual({ kind: 'JobHoursOutOfRange', hours: 9, maxHours: 8 })
  })

  it('refuses a second team out', async () => {
    const outcome = await sendFrom(homeTown({ jobSlot: outJob }), {
      site: { area: 1, site: 1 },
      team: { worker: 99, truck: 0 },
    })

    expect(outcomeOf(outcome)).toEqual({ kind: 'TeamAlreadyOut' })
  })

  it('refuses a site outside the areas a player can browse or the sites of an area', async () => {
    const tooBig = { worker: 99, truck: 0 }
    const outcomes = await Promise.all(
      [
        { area: 3, site: 4 },
        { area: 0, site: 4 },
        { area: 2, site: 16 },
        { area: 2, site: 0 },
        { area: 2, site: 2.5 },
      ].map((site) => sendFrom(homeTown(), { site, team: tooBig })),
    )

    expect(outcomes.map(outcomeOf)).toEqual([
      { kind: 'JobSiteOutOfBounds', area: 3, site: 4 },
      { kind: 'JobSiteOutOfBounds', area: 0, site: 4 },
      { kind: 'JobSiteOutOfBounds', area: 2, site: 16 },
      { kind: 'JobSiteOutOfBounds', area: 2, site: 0 },
      { kind: 'JobSiteOutOfBounds', area: 2, site: 2.5 },
    ])
  })

  it("refuses the town's own site", async () => {
    const outcome = await sendFrom(homeTown(), {
      site: { area: 1, site: 1 },
      team: { worker: 99, truck: 0 },
    })

    expect(outcomeOf(outcome)).toEqual({ kind: 'JobToOwnSite' })
  })

  it('refuses a site another town holds', async () => {
    const outcome = await sendFrom(homeTown(), {
      site: { area: 1, site: 9 },
      team: { worker: 99, truck: 0 },
    })

    expect(outcomeOf(outcome)).toEqual({ kind: 'SiteHeld', area: 1, site: 9 })
  })

  it('refuses a team larger than the hires at home, naming the first kind short', async () => {
    const outcomes = await Promise.all([
      sendFrom(homeTown(), { team: { worker: 7, truck: 3 } }),
      sendFrom(homeTown(), { team: { worker: 6, truck: 3 } }),
    ])

    expect(outcomes.map(outcomeOf)).toEqual([
      { kind: 'NotEnoughHiresAtHome', hire: 'worker', count: 7, atHome: 6 },
      { kind: 'NotEnoughHiresAtHome', hire: 'truck', count: 3, atHome: 2 },
    ])
  })

  it('counts the hires an open order has delivered by the dispatch as at home', async () => {
    const hiringTown = homeTown({
      hires: { worker: 0, truck: 0 },
      hiringSlot: {
        kind: 'busy',
        hire: 'worker',
        count: 5,
        costPerHire: { money: 0, food: 0, power: 0, material: 0 },
        secondsPerHire: 3600,
        startedAt: storedAt,
      },
    })
    const outcomes = await Promise.all([
      sendFrom(hiringTown, { team: { worker: 5, truck: 0 } }),
      sendFrom(hiringTown, { team: { worker: 5, truck: 0 } }, plainCatalog, daysAfterEpoch(1.01)),
    ])

    expect(outcomes.map(outcomeOf)).toEqual([
      'sent',
      { kind: 'NotEnoughHiresAtHome', hire: 'worker', count: 5, atHome: 0 },
    ])
  })

  it('writes nothing when it refuses', async () => {
    const town = homeTown()
    const { towns } = await sendFrom(town, { hours: 0 })

    expect(towns.storedTownOf('player-1')).toBe(town)
  })
})
