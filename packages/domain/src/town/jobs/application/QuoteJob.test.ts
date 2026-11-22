import { assert, describe, expect, it } from 'vitest'
import { signedUpAccountsOf } from '#account/testing/signedUpAccountsOf'
import { inMemoryBands } from '#learning/curriculum/testing/inMemoryBands'
import { inMemoryLessons } from '#learning/curriculum/testing/inMemoryLessons'
import type { Clock } from '#platform/domain/Clock'
import { inMemoryUnitOfWork } from '#platform/testing/inMemoryUnitOfWork'
import { Instant } from '#time/Instant'
import type { Town } from '../../domain/Town'
import { inMemoryEarnedSkills } from '../../testing/inMemoryEarnedSkills'
import { inMemoryTownStores } from '../../testing/inMemoryTownStores'
import { inMemoryTowns } from '../../testing/inMemoryTowns'
import { plainTownSettings, townCatalogOf } from '../../testing/townCatalogOf'
import { townOf } from '../../testing/townFixtures'
import type { JobOrder } from '../domain/JobOrder'
import { inMemoryRegionMap } from '../testing/inMemoryRegionMap'
import { QuoteJob } from './QuoteJob'
import { SendJob } from './SendJob'

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
): ReturnType<QuoteJob['execute']> =>
  new QuoteJob({
    towns,
    regionMap: inMemoryRegionMap([homeTown]),
    townCatalog: catalog,
    clock: frozenClock,
  }).execute(order(change))

const sentPayOf = async (town: Town): Promise<unknown> => {
  const sent = await new SendJob({
    unitOfWork: inMemoryUnitOfWork(
      inMemoryTownStores({
        accounts: signedUpAccountsOf(['player-1']),
        towns: inMemoryTowns([town], inMemoryEarnedSkills([])),
        regionMap: inMemoryRegionMap([town]),
      }),
    ),
    townCatalog: catalog,
    lessons: { ...inMemoryLessons([], []), ...inMemoryBands([]) },
    clock: frozenClock,
  }).execute(order())
  assert(sent.ok && sent.value.town.jobSlot.kind === 'out')
  return sent.value.town.jobSlot.pay
}

describe('QuoteJob', () => {
  it('answers the pay the send then fixes', async () => {
    const quoted = await quoteFrom(inMemoryTowns([homeTown], inMemoryEarnedSkills([])))

    expect(quoted).toEqual({ ok: true, value: await sentPayOf(homeTown) })
  })

  it('refuses an order the send would refuse', async () => {
    const quoted = await quoteFrom(inMemoryTowns([homeTown], inMemoryEarnedSkills([])), {
      hours: 9,
    })

    expect(quoted).toEqual({
      ok: false,
      error: { kind: 'JobHoursOutOfRange', hours: 9, maxHours: 8 },
    })
  })

  it('refuses a player with no town', async () => {
    const quoted = await quoteFrom(inMemoryTowns([], inMemoryEarnedSkills([])))

    expect(quoted).toEqual({ ok: false, error: { kind: 'TownNotFound', playerId: 'player-1' } })
  })

  it('writes nothing', async () => {
    const towns = inMemoryTowns([homeTown], inMemoryEarnedSkills([]))

    await quoteFrom(towns)

    expect(towns.storedTownOf('player-1')).toBe(homeTown)
  })
})
