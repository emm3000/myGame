import { en, es } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import { act, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'

type CopyLanguage = Pick<TownOverview, 'scaffold' | 'chromePhase'>

const spanishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'scaffold' }
const bothPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'both' }
const englishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'english' }
const noScaffold: CopyLanguage = { scaffold: 'none', chromePhase: 'english' }

const readAt = Date.parse(knownTown.readAt)

beforeEach(() => {
  vi.useFakeTimers({ now: readAt })
})

afterEach(() => {
  vi.useRealTimers()
})

const instantAfter = (seconds: number): string => new Date(readAt + seconds * 1000).toISOString()

const showTownIn = async (
  language: CopyLanguage,
  town: Partial<TownOverview> = {},
): Promise<void> => {
  const client: ApiClient = stubApiClient({
    currentPlayer: async () => knownPlayer,
    town: async () => ({ ok: true, value: { ...knownTown, ...language, ...town } }),
  })
  renderAppAt('/', client)
  await act(() => vi.advanceTimersByTimeAsync(0))
}

const both = (english: string, spanish: string): string => `${english} ${spanish}`

const linesReading = (text: string): ReadonlyArray<HTMLElement> =>
  screen.queryAllByText((_, element) => element?.textContent === text)

const farmCost = { money: 60, food: 40, power: 0, material: 80 }

const workOnFarm: TownOverview['work'] = {
  slot: {
    building: 'farm',
    level: 1,
    cost: farmCost,
    startsAt: instantAfter(-60),
    finishesAt: instantAfter(240),
  },
  waitingList: [
    {
      building: 'homes',
      level: 2,
      cost: farmCost,
      startsAt: instantAfter(240),
      finishesAt: instantAfter(540),
    },
  ],
  cap: 2,
}

it('names the place in work in English over Spanish in the both phase', async () => {
  await showTownIn(bothPhase, { work: workOnFarm })

  expect(linesReading(both(en.namesPlacesFarm(), es.namesPlacesFarm()))).not.toHaveLength(0)
})

it('titles the build slot in English under none', async () => {
  await showTownIn(noScaffold, { work: workOnFarm })

  expect(linesReading(en.townWorkTitle())).not.toHaveLength(0)
})

it('stops the work by a Spanish button in the Spanish phase', async () => {
  await showTownIn(spanishPhase, { work: workOnFarm })

  const stop = es.townWorkStopOf({ place: es.namesPlacesFarm(), level: 1 })

  expect(screen.getByRole('button', { name: stop })).toBeDefined()
})

it('titles the waiting list in English alone in the English phase', async () => {
  await showTownIn(englishPhase, { work: workOnFarm })

  expect(linesReading(en.townWorkWaitingList())).not.toHaveLength(0)
})

it('invites to hire in English over Spanish in the both phase', async () => {
  await showTownIn(bothPhase)

  expect(linesReading(both(en.townOfficeIdle(), es.townOfficeIdle()))).not.toHaveLength(0)
})

it('names the hires on order in English under none', async () => {
  const hiring: Partial<TownOverview> = {
    hiring: {
      ...knownTown.hiring,
      order: {
        hire: 'worker',
        count: 3,
        delivered: 1,
        secondsPerHire: 60,
        startedAt: instantAfter(-60),
        endsAt: instantAfter(120),
      },
    },
  }
  await showTownIn(noScaffold, hiring)

  expect(linesReading(en.townOfficeDelivered({ delivered: 1, count: 3 }))).not.toHaveLength(0)
})

const fallOfYearTwo: Partial<TownOverview> = {
  season: {
    kind: 'fall',
    year: 2,
    endsAt: instantAfter(3 * 86_400),
    productionPercent: { money: 100, food: 100, power: 100, material: 100 },
    durationPercent: { build: 100, study: 100, hire: 100, road: 75 },
  },
}

it('writes the season in English alone in the English phase', async () => {
  await showTownIn(englishPhase, fallOfYearTwo)

  expect(linesReading(en.townSeasonLine({ season: 'Fall', year: 2 }))).not.toHaveLength(0)
})

it('counts down the season in English under none', async () => {
  await showTownIn(noScaffold, fallOfYearTwo)

  const endsIn = en.townSeasonEndsIn({ season: 'Fall', timeLeft: en.townSeasonDays({ days: 3 }) })

  expect(linesReading(endsIn)).not.toHaveLength(0)
})

it('names the minute the money arrives in English alone in the English phase', async () => {
  await showTownIn(englishPhase, {
    stocks: { ...knownTown.stocks, money: { ...knownTown.stocks.money, amount: 10 } },
  })

  expect(linesReading(en.townReadyIn({ time: '50 min' }))).not.toHaveLength(0)
})

it('counts down to the next review in English over Spanish in the both phase', async () => {
  await showTownIn(bothPhase, { nextDueAt: instantAfter(540) })

  expect(linesReading(both(en.reviewNextReview(), es.reviewNextReview()))).not.toHaveLength(0)
})
