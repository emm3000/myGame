import type { FiefOverview } from '@mygame/contracts'
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, assert, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

const readAt = new Date(knownFief.readAt)

beforeEach(() => {
  vi.useFakeTimers({ now: readAt })
  localStorage.clear()
  Reflect.deleteProperty(globalThis, 'Notification')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const readsServing = (reads: ReadonlyArray<FiefOverview>): ApiClient['fief'] => {
  const pending = [...reads]
  return () => {
    const next = pending.shift()
    return next === undefined
      ? new Promise(() => undefined)
      : Promise.resolve({ ok: true, value: next })
  }
}

const showFief = async (apiClient: ApiClient): Promise<void> => {
  renderAppAt(knownFiefPath, apiClient)
  await passSeconds(0)
}

const showFiefReading = async (reads: ReadonlyArray<FiefOverview>): Promise<void> => {
  await showFief(
    stubApiClient({ currentPlayer: async () => knownPlayer, fief: readsServing(reads) }),
  )
}

const liveRegion = (): Element => {
  const regions = document.querySelectorAll('[aria-live="polite"]')
  expect(regions).toHaveLength(1)
  const [region] = regions
  assert(region !== undefined)
  return region
}

const sawmillFinishingInThirtySeconds: FiefOverview = {
  ...knownFief,
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    startedAt: '2026-09-22T11:58:00.000Z',
    finishesAt: '2026-09-22T12:00:30.000Z',
  },
}

const sawmillFinished: FiefOverview = {
  ...knownFief,
  buildings: { ...knownFief.buildings, sawmill: { ...knownFief.buildings.sawmill, level: 2 } },
  readAt: '2026-09-22T12:00:30.000Z',
}

const sawmillFinishedRereadLater: FiefOverview = {
  ...sawmillFinished,
  readAt: '2026-09-22T12:01:30.000Z',
}

it('renders the live region empty from the mount', async () => {
  await showFiefReading([])

  expect(liveRegion().textContent).toBe('')
})

it('announces a finish the re-read shows, once', async () => {
  await showFiefReading([sawmillFinishingInThirtySeconds, sawmillFinished])

  await passSeconds(30)

  expect(liveRegion().textContent).toBe('Obra terminada: aserradero, nivel 2.')
})

it('leaves the live region empty when the re-read shows no finish', async () => {
  await showFiefReading([
    sawmillFinishingInThirtySeconds,
    sawmillFinished,
    sawmillFinishedRereadLater,
  ])
  await passSeconds(30)

  await passSeconds(60)

  expect(liveRegion().textContent).toBe('')
})

it('announces nothing when a countdown reaches zero without a re-read', async () => {
  await showFiefReading([sawmillFinishingInThirtySeconds])

  await passSeconds(30)

  expect(liveRegion().textContent).toBe('')
})

it('announces nothing on the first read of a mount', async () => {
  await showFiefReading([sawmillFinished])

  expect(liveRegion().textContent).toBe('')
})

const barracksLevying: FiefOverview = {
  ...knownFief,
  buildings: { ...knownFief.buildings, barracks: { ...knownFief.buildings.barracks, level: 1 } },
  recruitOrder: {
    unit: 'infantry',
    count: 12,
    delivered: 10,
    perUnitSeconds: 30,
    startedAt: '2026-09-22T11:54:30.000Z',
    endsAt: '2026-09-22T12:00:30.000Z',
  },
  units: { ...knownFief.units, infantry: 10 },
}

const levyCancelledAtTheBarracks: FiefOverview = {
  ...barracksLevying,
  recruitOrder: null,
  readAt: '2026-09-22T12:00:05.000Z',
}

it('announces nothing for a levy the lord cancels on this screen', async () => {
  await showFief(
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: readsServing([barracksLevying]),
      cancelRecruitOrder: async () => ({ ok: true, value: levyCancelledAtTheBarracks }),
    }),
  )
  await passSeconds(5)

  fireEvent.click(screen.getByRole('button', { name: copy.army.cancelOf('infantry', 12) }))
  await passSeconds(0)

  expect(liveRegion().textContent).toBe('')
})
