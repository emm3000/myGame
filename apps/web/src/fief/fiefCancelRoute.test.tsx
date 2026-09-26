import type { BuildingKind, FiefOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, assert, beforeEach, expect, it, vi } from 'vitest'
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

const sawmillWithTwoWaiting: FiefOverview = {
  ...sawmillUpgradeUnderWay,
  queue: {
    entries: [
      {
        building: 'quarry',
        targetLevel: 2,
        startsAt: '2026-09-22T12:03:12.000Z',
        finishesAt: '2026-09-22T12:06:24.000Z',
      },
      {
        building: 'farm',
        targetLevel: 2,
        startsAt: '2026-09-22T12:06:24.000Z',
        finishesAt: '2026-09-22T12:09:36.000Z',
      },
    ],
    cap: 4,
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

const cancelButtonOf = (building: BuildingKind, targetLevel: number): HTMLElement =>
  screen.getByRole('button', { name: copy.fief.cancelOf(building, targetLevel) })

const cancelButton = (): HTMLElement => cancelButtonOf('sawmill', 2)

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

const waitingRows = (): ReadonlyArray<HTMLElement> =>
  within(screen.getByRole('list', { name: copy.names.buildQueue })).getAllByRole('listitem')

it('cancels the upgrade in progress from the slot', async () => {
  const cancelUpgrade = vi.fn(async () => ({ ok: true as const, value: knownFief }))
  await showFief({ cancelUpgrade })

  fireEvent.click(cancelButton())
  await passSeconds(0)

  expect(cancelUpgrade).toHaveBeenCalledTimes(1)
  expect(cancelUpgrade).toHaveBeenCalledWith({ building: 'sawmill', targetLevel: 2 })
  expect(screen.getByText(copy.names.idleSlot)).toBeDefined()
  expect(screen.queryByRole('button', { name: copy.fief.cancelOf('sawmill', 2) })).toBeNull()
})

it('cancels a waiting upgrade from its row', async () => {
  const farmCancelled: FiefOverview = {
    ...sawmillWithTwoWaiting,
    queue: {
      ...sawmillWithTwoWaiting.queue,
      entries: sawmillWithTwoWaiting.queue.entries.slice(0, 1),
    },
  }
  const cancelUpgrade = vi.fn(async () => ({ ok: true as const, value: farmCancelled }))
  await showFief({ fief: async () => ({ ok: true, value: sawmillWithTwoWaiting }), cancelUpgrade })

  const [, farmRow] = waitingRows()
  assert(farmRow !== undefined)
  fireEvent.click(within(farmRow).getByRole('button', { name: copy.fief.cancelOf('farm', 2) }))
  await passSeconds(0)

  expect(cancelUpgrade).toHaveBeenCalledWith({ building: 'farm', targetLevel: 2 })
  expect(waitingRows()).toHaveLength(1)
})

it('names in each cancel the entry its row shows', async () => {
  const cancelUpgrade = vi.fn(async () => ({ ok: true as const, value: sawmillWithTwoWaiting }))
  await showFief({ fief: async () => ({ ok: true, value: sawmillWithTwoWaiting }), cancelUpgrade })

  const [quarryRow] = waitingRows()
  assert(quarryRow !== undefined)
  fireEvent.click(within(quarryRow).getByRole('button'))
  await passSeconds(0)

  expect(cancelUpgrade).toHaveBeenCalledWith({ building: 'quarry', targetLevel: 2 })
  expect(within(quarryRow).getByRole('button').getAttribute('aria-label')).toBe(
    copy.fief.cancelOf('quarry', 2),
  )
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

it('shows the Spanish reason when the upgrade is gone before the cancel', async () => {
  const cancelUpgrade = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: false,
    refusal: 'UpgradeNotFound',
  })
  await showFief({ cancelUpgrade })

  fireEvent.click(cancelButton())
  await passSeconds(0)

  expect(screen.getByRole('alert').textContent).toBe(
    'Esa obra ya no está en tu cola. No queda nada que cancelar.',
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
  expect(screen.queryByRole('button', { name: copy.fief.cancelOf('sawmill', 2) })).toBeNull()
})
