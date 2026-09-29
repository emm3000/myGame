import type { FiefOverview } from '@mygame/contracts'
import { act, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownFief, knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'

const readAt = new Date(knownFief.readAt)

beforeEach(() => {
  vi.useFakeTimers({ now: readAt })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const signedInClientServing = (fief: () => FiefOverview): ApiClient =>
  stubApiClient({
    currentPlayer: async () => knownPlayer,
    fief: async () => ({ ok: true, value: fief() }),
  })

const showFief = async (apiClient: ApiClient): Promise<void> => {
  renderAppAt('/', apiClient)
  await passSeconds(0)
}

const neutralPercents = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const neutralDurations = { build: 100, study: 100 }

const autumnEndingInThreeDaysAndFiveHours: FiefOverview = {
  ...knownFief,
  season: {
    kind: 'autumn',
    year: 1,
    endsAt: '2026-09-25T17:00:00.000Z',
    multiplierPercent: { ...neutralPercents, gold: 125 },
    durationPercent: neutralDurations,
  },
}

it('shows the season and the year the fief read answered', async () => {
  await showFief(signedInClientServing(() => autumnEndingInThreeDaysAndFiveHours))

  expect(screen.getByText('Otoño, año 1')).toBeDefined()
  expect(screen.getByText('Invierno en 3 días')).toBeDefined()
})

const winterEndingInADayAndHalfAMinute: FiefOverview = {
  ...knownFief,
  season: {
    kind: 'winter',
    year: 1,
    endsAt: '2026-09-23T12:00:30.000Z',
    multiplierPercent: { ...neutralPercents, food: 75 },
    durationPercent: neutralDurations,
  },
}

const seasonCountdown = (): string | null =>
  screen.getByText(/^Primavera en/, { selector: '[role="timer"]' }).textContent

it('counts down to the end of the season', async () => {
  await showFief(signedInClientServing(() => winterEndingInADayAndHalfAMinute))
  expect(seasonCountdown()).toBe('Primavera en 1 día')

  await passSeconds(31)

  expect(seasonCountdown()).toBe('Primavera en 23 h 59 min')
})

const summerEndingInHalfAMinute: FiefOverview = {
  ...knownFief,
  season: {
    kind: 'summer',
    year: 1,
    endsAt: '2026-09-22T12:00:30.000Z',
    multiplierPercent: neutralPercents,
    durationPercent: neutralDurations,
  },
}

it('reads the fief again when the season ends', async () => {
  const fief = vi.fn(() => summerEndingInHalfAMinute)
  await showFief(signedInClientServing(fief))
  await passSeconds(29)
  expect(fief).toHaveBeenCalledTimes(1)

  await passSeconds(1)

  expect(fief).toHaveBeenCalledTimes(2)
})

const autumnReadWhenSummerEnded: FiefOverview = {
  ...knownFief,
  season: {
    kind: 'autumn',
    year: 1,
    endsAt: '2026-09-29T12:00:30.000Z',
    multiplierPercent: { ...neutralPercents, gold: 125 },
    durationPercent: neutralDurations,
  },
  readAt: '2026-09-22T12:00:30.000Z',
}

it('shows the next season after that read', async () => {
  const reads = [summerEndingInHalfAMinute, autumnReadWhenSummerEnded]
  await showFief(signedInClientServing(() => reads.shift() ?? autumnReadWhenSummerEnded))
  expect(screen.getByText('Verano, año 1')).toBeDefined()

  await passSeconds(30)

  expect(screen.queryByText('Verano, año 1')).toBeNull()
  expect(screen.getByText('Otoño, año 1')).toBeDefined()
  expect(screen.getByText('Invierno en 7 días')).toBeDefined()
})

it('shows no season before the calendar starts', async () => {
  await showFief(signedInClientServing(() => knownFief))

  expect(screen.getByRole('heading', { name: knownFief.name })).toBeDefined()
  expect(screen.queryByText(/, año \d+$/)).toBeNull()
  expect(screen.queryByText(/ en \d/)).toBeNull()
})

const springEndingInSixDays: FiefOverview = {
  ...knownFief,
  season: {
    kind: 'spring',
    year: 2,
    endsAt: '2026-09-28T12:00:00.000Z',
    multiplierPercent: { ...neutralPercents, food: 125 },
    durationPercent: neutralDurations,
  },
}

it('counts down to summer in spring', async () => {
  await showFief(signedInClientServing(() => springEndingInSixDays))

  expect(screen.getByText('Primavera, año 2')).toBeDefined()
  expect(screen.getByText('Verano en 6 días')).toBeDefined()
})

it('counts down to autumn in summer', async () => {
  await showFief(signedInClientServing(() => summerEndingInHalfAMinute))

  expect(screen.getByText('Otoño en 0:30')).toBeDefined()
})

const summerEndingAfterTheLongestTimeout: FiefOverview = {
  ...knownFief,
  season: {
    kind: 'summer',
    year: 1,
    endsAt: '2026-10-22T12:00:00.000Z',
    multiplierPercent: neutralPercents,
    durationPercent: neutralDurations,
  },
}

it('waits for the minute re-read when the season ends past the longest timeout', async () => {
  const fief = vi.fn(() => summerEndingAfterTheLongestTimeout)
  await showFief(signedInClientServing(fief))

  await passSeconds(59)

  expect(fief).toHaveBeenCalledTimes(1)
})

const storeOf = (resource: string): HTMLElement => screen.getByRole('listitem', { name: resource })

const seasonMarkIn = (resource: string): HTMLElement | null =>
  within(storeOf(resource)).queryByText(/^\S+: [+-]\d+ % de \S+$/)

it('marks the food rate winter lowers', async () => {
  await showFief(signedInClientServing(() => winterEndingInADayAndHalfAMinute))

  expect(seasonMarkIn('comida')?.textContent).toBe('Invierno: -25 % de comida')
  expect(seasonMarkIn('oro')).toBeNull()
})

it('marks the gold rate autumn raises', async () => {
  await showFief(signedInClientServing(() => autumnEndingInThreeDaysAndFiveHours))

  expect(seasonMarkIn('oro')?.textContent).toBe('Otoño: +25 % de oro')
  expect(seasonMarkIn('comida')).toBeNull()
})

it('marks no resource in summer', async () => {
  await showFief(signedInClientServing(() => summerEndingInHalfAMinute))

  for (const resource of ['madera', 'piedra', 'hierro', 'oro', 'comida']) {
    expect(seasonMarkIn(resource)).toBeNull()
  }
})

it('marks no resource before the calendar starts', async () => {
  await showFief(signedInClientServing(() => knownFief))

  for (const resource of ['madera', 'piedra', 'hierro', 'oro', 'comida']) {
    expect(seasonMarkIn(resource)).toBeNull()
  }
})

const winterWithAFractionalFoodRate: FiefOverview = {
  ...winterEndingInADayAndHalfAMinute,
  resources: {
    ...knownFief.resources,
    food: { amount: 1000, ratePerHour: 11.25, capacity: 20000 },
  },
}

it('shows the rate the fief read answered', async () => {
  await showFief(signedInClientServing(() => winterWithAFractionalFoodRate))

  expect(within(storeOf('comida')).getByText('+11 / h')).toBeDefined()
})
