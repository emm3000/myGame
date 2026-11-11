import { assert, describe, expect, it } from 'vitest'
import type { Clock } from '../ports/Clock'
import { inMemoryRegionMap } from '../testing/inMemoryRegionMap'
import { inMemoryTownNews } from '../testing/inMemoryTownNews'
import { inMemoryTowns } from '../testing/inMemoryTowns'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { JobOrder } from './JobOrder'
import { quoteJob } from './quoteJob'
import { sendJob } from './sendJob'
import type { Town } from './Town'

const MILLISECONDS_PER_DAY = 86_400_000

const daysAfterEpoch = (days: number): Instant =>
  Instant.fromEpochMilliseconds(
    plainTownSettings.seasons.epoch.epochMilliseconds + days * MILLISECONDS_PER_DAY,
  )

const storedAt = daysAfterEpoch(1)

const quotedAt = daysAfterEpoch(2)

const frozenClock: Clock = { now: () => quotedAt }

const catalog = townCatalogOf()

const homeTown = townOf({
  stocks: { money: 100, food: 100, power: 100, material: 100 },
  storedAt,
  hires: { worker: 6, truck: 2 },
})

const order = (change: Partial<JobOrder> = {}): JobOrder => ({
  playerId: 'player-1',
  site: { area: 1, site: 5 },
  team: { worker: 4, truck: 1 },
  hours: 3,
  ...change,
})

const quoteFrom = (
  towns: ReturnType<typeof inMemoryTowns>,
  change: Partial<JobOrder> = {},
): ReturnType<typeof quoteJob> =>
  quoteJob(order(change), {
    towns,
    map: inMemoryRegionMap([homeTown]),
    catalog,
    clock: frozenClock,
  })

const sentPayOf = async (town: Town): Promise<unknown> => {
  const sent = await sendJob(order(), {
    towns: inMemoryTowns([town]),
    map: inMemoryRegionMap([town]),
    news: inMemoryTownNews(),
    catalog,
    clock: frozenClock,
  })
  assert(sent.ok && sent.value.jobSlot.kind === 'out')
  return sent.value.jobSlot.pay
}

describe('quoteJob', () => {
  it('answers the pay the send then fixes', async () => {
    const quoted = await quoteFrom(inMemoryTowns([homeTown]))

    expect(quoted).toEqual({ ok: true, value: await sentPayOf(homeTown) })
  })

  it('refuses an order the send would refuse', async () => {
    const quoted = await quoteFrom(inMemoryTowns([homeTown]), { hours: 9 })

    expect(quoted).toEqual({
      ok: false,
      error: { kind: 'JobHoursOutOfRange', hours: 9, maxHours: 8 },
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
