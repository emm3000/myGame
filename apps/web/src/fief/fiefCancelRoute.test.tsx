import type { FiefOverview } from '@mygame/contracts'
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownFief, knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownFief.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const sawmillUpgradeUnderWay: FiefOverview = {
  ...knownFief,
  resources: {
    ...knownFief.resources,
    wood: { ...knownFief.resources.wood, amount: 910 },
  },
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    startedAt: '2026-09-22T11:59:00.000Z',
    finishesAt: '2026-09-22T12:03:12.000Z',
  },
}

const showFief = async (overrides: Partial<ApiClient>): Promise<void> => {
  renderAppAt(
    '/',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: sawmillUpgradeUnderWay }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const cancelButton = (): HTMLElement => screen.getByRole('button', { name: copy.fief.cancel })

interface Deferred<T> {
  readonly promise: Promise<T>
  readonly resolve: (value: T) => void
}

const deferred = <T,>(): Deferred<T> => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

it('cancels the upgrade in progress from the slot', async () => {
  const cancelUpgrade = vi.fn(async () => ({ ok: true as const, value: knownFief }))
  await showFief({ cancelUpgrade })

  fireEvent.click(cancelButton())
  await passSeconds(0)

  expect(cancelUpgrade).toHaveBeenCalledTimes(1)
  expect(screen.getByText(copy.names.idleSlot)).toBeDefined()
  expect(screen.queryByRole('button', { name: copy.fief.cancel })).toBeNull()
})

it('cancels at most once on a double click', async () => {
  const answer = deferred<ApiOutcome<FiefOverview>>()
  const cancelUpgrade = vi.fn(() => answer.promise)
  await showFief({ cancelUpgrade })

  fireEvent.click(cancelButton())
  fireEvent.click(cancelButton())
  answer.resolve({ ok: true, value: knownFief })
  await passSeconds(0)

  expect(cancelUpgrade).toHaveBeenCalledTimes(1)
})

it('shows the Spanish reason when the upgrade finished before the cancel', async () => {
  const cancelUpgrade = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: false,
    refusal: 'SlotIdle',
  })
  await showFief({ cancelUpgrade })

  fireEvent.click(cancelButton())
  await passSeconds(0)

  expect(screen.getByRole('alert').textContent).toBe(
    'Tu obra ya ha terminado. No queda nada que cancelar.',
  )
})

it('offers no cancel on a slot that just finished', async () => {
  const sawmillJustFinished: FiefOverview = {
    ...sawmillUpgradeUnderWay,
    slot: {
      kind: 'busy',
      building: 'sawmill',
      targetLevel: 2,
      startedAt: '2026-09-22T11:59:00.000Z',
      finishesAt: knownFief.readAt,
    },
  }
  await showFief({ fief: async () => ({ ok: true, value: sawmillJustFinished }) })

  expect(screen.getByText(copy.fief.justFinished)).toBeDefined()
  expect(screen.queryByRole('button', { name: copy.fief.cancel })).toBeNull()
})
