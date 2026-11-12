import { assert, describe, expect, it } from 'vitest'
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
    map: inMemoryRegionMap([homeTown]),
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
