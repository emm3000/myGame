import type { FiefOverview } from '@mygame/contracts'
import { act, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownFief, knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'
import { slotTrackFill } from './slotTrackFill.testSupport'

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

const woodCell = (): HTMLElement =>
  screen.getByRole('listitem', { name: copy.names.resources.wood })

it('advances the wood amount between reads from the server rate', async () => {
  const woodAtOnePerSecond: FiefOverview = {
    ...knownFief,
    resources: {
      ...knownFief.resources,
      wood: { amount: 1000, ratePerHour: 3600, capacity: 20000 },
    },
  }
  await showFief(signedInClientServing(() => woodAtOnePerSecond))

  await passSeconds(10)

  expect(woodCell().textContent).toContain('1 010')
})

it('stops the interpolated amount at the capacity', async () => {
  const woodTenSecondsFromFull: FiefOverview = {
    ...knownFief,
    resources: {
      ...knownFief.resources,
      wood: { amount: 19990, ratePerHour: 3600, capacity: 20000 },
    },
  }
  await showFief(signedInClientServing(() => woodTenSecondsFromFull))

  await passSeconds(30)

  expect(within(woodCell()).getByText('20 000')).toBeDefined()
})

it('keeps an amount above the capacity where the read left it', async () => {
  const woodAboveCapacity: FiefOverview = {
    ...knownFief,
    resources: {
      ...knownFief.resources,
      wood: { amount: 1200, ratePerHour: 3600, capacity: 1000 },
    },
  }
  await showFief(signedInClientServing(() => woodAboveCapacity))

  await passSeconds(30)

  expect(within(woodCell()).getByText('1 200')).toBeDefined()
})

const sawmillStartedNinetySecondsAgo: FiefOverview = {
  ...knownFief,
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    startedAt: '2026-09-22T11:58:30.000Z',
    finishesAt: '2026-09-22T12:00:30.000Z',
  },
}

it('re-reads the fief when the countdown reaches zero', async () => {
  const fief = vi.fn(() => sawmillStartedNinetySecondsAgo)
  await showFief(signedInClientServing(fief))

  await passSeconds(30)

  expect(fief).toHaveBeenCalledTimes(2)
})

it('fills the track by the elapsed share of the upgrade on the first read', async () => {
  await showFief(signedInClientServing(() => sawmillStartedNinetySecondsAgo))

  expect(slotTrackFill()).toBe('75')
})

it('keeps filling the track between reads', async () => {
  await showFief(signedInClientServing(() => sawmillStartedNinetySecondsAgo))

  await passSeconds(15)

  expect(slotTrackFill()).toBe('88')
})

it('does not re-read more than once a minute while idle', async () => {
  const fief = vi.fn(() => knownFief)
  await showFief(signedInClientServing(fief))

  await passSeconds(59)

  expect(fief).toHaveBeenCalledTimes(1)
})

const regainFocus = async (): Promise<void> => {
  await act(async () => {
    window.dispatchEvent(new Event('focus'))
  })
}

it('re-reads the fief when the window regains focus', async () => {
  const fief = vi.fn(() => knownFief)
  await showFief(signedInClientServing(fief))
  await passSeconds(2)

  await regainFocus()

  expect(fief).toHaveBeenCalledTimes(2)
})

it('ignores a focus that lands within a second of the last read', async () => {
  const fief = vi.fn(() => knownFief)
  await showFief(signedInClientServing(fief))

  await regainFocus()
  await regainFocus()

  expect(fief).toHaveBeenCalledTimes(1)
})

it('re-reads the fief a minute after the last read', async () => {
  const fief = vi.fn(() => knownFief)
  await showFief(signedInClientServing(fief))
  await passSeconds(59)
  expect(fief).toHaveBeenCalledTimes(1)

  await passSeconds(1)

  expect(fief).toHaveBeenCalledTimes(2)
})

it("shows the tier image on a built building's card", async () => {
  const farmAtLevelThree: FiefOverview = {
    ...knownFief,
    buildings: {
      ...knownFief.buildings,
      farm: { ...knownFief.buildings.farm, level: 3 },
    },
  }
  await showFief(signedInClientServing(() => farmAtLevelThree))

  const farmCard = screen.getByRole('listitem', { name: copy.names.buildings.farm })

  expect(within(farmCard).getByRole('presentation').getAttribute('src')).toMatch(/\/farm-2\.png$/)
})
