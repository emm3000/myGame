import type { FiefOverview } from '@mygame/contracts'
import { act, screen } from '@testing-library/react'
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

const autumnEndingInThreeDaysAndFiveHours: FiefOverview = {
  ...knownFief,
  season: {
    kind: 'autumn',
    year: 1,
    endsAt: '2026-09-25T17:00:00.000Z',
    multiplierPercent: { ...neutralPercents, gold: 125 },
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
