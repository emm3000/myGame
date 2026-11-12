import { assert, describe, expect, it } from 'vitest'
import type { DomainError } from '../DomainError'
import type { Clock } from '../ports/Clock'
import { inMemoryCleanUps } from '../testing/inMemoryCleanUps'
import { inMemoryRegionMap } from '../testing/inMemoryRegionMap'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { CleanUp } from './CleanUp'
import type { CleanUpOrder } from './CleanUpOrder'
import { quoteCleanUp } from './quoteCleanUp'
import { sendCleanUp } from './sendCleanUp'
import type { Town } from './Town'

const MILLISECONDS_PER_MINUTE = 60_000

const MILLISECONDS_PER_DAY = 86_400_000

const storedAt = Instant.fromEpochMilliseconds(
  plainTownSettings.seasons.epoch.epochMilliseconds + MILLISECONDS_PER_DAY,
)

const quotedAt = Instant.fromEpochMilliseconds(
  storedAt.epochMilliseconds + 60 * MILLISECONDS_PER_MINUTE,
)

const frozenClock: Clock = { now: () => quotedAt }

const catalog = townCatalogOf()

const smallWasteSite = { area: 2, site: 1 }

const homeTown = townOf({
  stocks: { money: 100, food: 100, power: 100, material: 100 },
  storedAt,
  hires: { worker: 8, truck: 2 },
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
  team: { worker: 6, truck: 0 },
  ...change,
})

const quoteFrom = (
  towns: ReturnType<typeof inMemoryTowns>,
  change: Partial<CleanUpOrder> = {},
  cleanUps: ReadonlyArray<CleanUp> = [],
): ReturnType<typeof quoteCleanUp> =>
  quoteCleanUp(order(change), {
    towns,
    map: inMemoryRegionMap([homeTown, neighborTown]),
    cleanUps: inMemoryCleanUps(cleanUps),
    catalog,
    clock: frozenClock,
  })

const sentCleanUpOf = async (town: Town, change: Partial<CleanUpOrder>): Promise<unknown> => {
  const sent = await sendCleanUp(order(change), {
    towns: inMemoryTowns([town]),
    map: inMemoryRegionMap([town]),
    cleanUps: inMemoryCleanUps(),
    news: inMemoryTownNews(),
    catalog,
    clock: frozenClock,
  })
  assert(sent.ok && sent.value.jobSlot.kind === 'out' && sent.value.jobSlot.cleanUp !== undefined)
  const { pay, cleanUp } = sent.value.jobSlot
  return { strength: cleanUp.strength, waste: cleanUp.waste, pay }
}

describe('quoteCleanUp', () => {
  it("answers the team's strength, the site's waste and the pay", async () => {
    const quoted = await quoteFrom(inMemoryTowns([homeTown]))

    expect(quoted).toEqual({
      ok: true,
      value: { strength: 6, waste: 6, pay: { money: 12, food: 0, power: 0, material: 18 } },
    })
  })

  it('answers no pay for a team whose strength falls short of the waste', async () => {
    const quoted = await quoteFrom(inMemoryTowns([homeTown]), { team: { worker: 5, truck: 0 } })

    expect(quoted).toEqual({
      ok: true,
      value: { strength: 5, waste: 6, pay: { money: 0, food: 0, power: 0, material: 0 } },
    })
  })

  it('agrees with the send for the same team, site and instant', async () => {
    const teams = [
      { worker: 6, truck: 0 },
      { worker: 3, truck: 1 },
      { worker: 5, truck: 0 },
    ]

    const quoted = await Promise.all(
      teams.map((team) => quoteFrom(inMemoryTowns([homeTown]), { team })),
    )
    const sent = await Promise.all(teams.map((team) => sentCleanUpOf(homeTown, { team })))

    expect(quoted).toEqual(sent.map((value) => ({ ok: true, value })))
  })

  const townWithTeamOut = async (): Promise<ReturnType<typeof inMemoryTowns>> => {
    const towns = inMemoryTowns([homeTown])
    await sendCleanUp(order({ team: { worker: 1, truck: 0 } }), {
      towns,
      map: inMemoryRegionMap([homeTown]),
      cleanUps: inMemoryCleanUps(),
      news: inMemoryTownNews(),
      catalog,
      clock: frozenClock,
    })
    return towns
  }

  const sharedRefusals: ReadonlyArray<{
    readonly refusal: DomainError['kind']
    readonly change: Partial<CleanUpOrder>
    readonly townsOf: () => Promise<ReturnType<typeof inMemoryTowns>>
    readonly error: DomainError
  }> = [
    {
      refusal: 'InvalidTeam',
      change: { team: { worker: 0, truck: 0 } },
      townsOf: async () => inMemoryTowns([homeTown]),
      error: { kind: 'InvalidTeam', team: { worker: 0, truck: 0 } },
    },
    {
      refusal: 'TeamAlreadyOut',
      change: {},
      townsOf: townWithTeamOut,
      error: { kind: 'TeamAlreadyOut' },
    },
    {
      refusal: 'JobSiteOutOfBounds',
      change: { site: { area: 3, site: 1 } },
      townsOf: async () => inMemoryTowns([homeTown]),
      error: { kind: 'JobSiteOutOfBounds', area: 3, site: 1 },
    },
    {
      refusal: 'JobToOwnSite',
      change: { site: { area: 1, site: 1 } },
      townsOf: async () => inMemoryTowns([homeTown]),
      error: { kind: 'JobToOwnSite' },
    },
    {
      refusal: 'SiteHeld',
      change: { site: { area: 1, site: 9 } },
      townsOf: async () => inMemoryTowns([homeTown]),
      error: { kind: 'SiteHeld', area: 1, site: 9 },
    },
  ]

  it.each(sharedRefusals)(
    'refuses as the send does with $refusal',
    async ({ change, townsOf, error }) => {
      const quoted = await quoteFrom(await townsOf(), change)

      expect(quoted).toEqual({ ok: false, error })
    },
  )

  it('refuses a site that holds no waste', async () => {
    const quoted = await quoteFrom(inMemoryTowns([homeTown]), { site: { area: 2, site: 3 } })

    expect(quoted).toEqual({ ok: false, error: { kind: 'NotAWasteSite', area: 2, site: 3 } })
  })

  it('refuses a waste site whose waste has not regrown since its clean-up', async () => {
    const cleaned: CleanUp = {
      townId: 'town-2',
      sentAt: storedAt,
      site: { region: 1, ...smallWasteSite },
      cleanedAt: quotedAt,
    }

    const quoted = await quoteFrom(inMemoryTowns([homeTown]), {}, [cleaned])

    expect(quoted).toEqual({ ok: false, error: { kind: 'NoWasteYet', area: 2, site: 1 } })
  })

  it('refuses a team larger than the hires at home', async () => {
    const quoted = await quoteFrom(inMemoryTowns([homeTown]), { team: { worker: 9, truck: 0 } })

    expect(quoted).toEqual({
      ok: false,
      error: { kind: 'NotEnoughHiresAtHome', hire: 'worker', count: 9, atHome: 8 },
    })
  })

  it('refuses a player with no town', async () => {
    const quoted = await quoteFrom(inMemoryTowns([]))

    expect(quoted).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'player-1' } })
  })

  it('writes nothing', async () => {
    const towns = inMemoryTowns([homeTown])

    await quoteFrom(towns)

    expect(towns.storedTownOf('player-1')).toBe(homeTown)
  })
})
