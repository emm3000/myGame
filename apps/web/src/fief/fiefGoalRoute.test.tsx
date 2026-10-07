import type { FiefOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
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

const fiefWithGoal = (goal: FiefOverview['goal']): FiefOverview => ({ ...knownFief, goal })

const barracksShortOfIronAndPeasants = fiefWithGoal({
  position: 9,
  count: 9,
  building: 'barracks',
  level: 1,
  state: 'pending',
  missing: { resources: [{ resource: 'iron', amount: 30 }], peasants: 1 },
})

const sawmillLevelTwoUnderway = fiefWithGoal({
  position: 6,
  count: 9,
  building: 'sawmill',
  level: 2,
  state: 'underway',
  missing: null,
})

const farmWithNothingMissing = fiefWithGoal({
  position: 2,
  count: 9,
  building: 'farm',
  level: 1,
  state: 'pending',
  missing: { resources: [], peasants: 0 },
})

const farmBehindAFullQueue: FiefOverview = {
  ...farmWithNothingMissing,
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    startedAt: '2026-09-22T11:59:00.000Z',
    finishesAt: '2026-09-22T12:30:00.000Z',
  },
  queue: {
    entries: [
      {
        building: 'quarry',
        targetLevel: 2,
        startsAt: '2026-09-22T12:30:00.000Z',
        finishesAt: '2026-09-22T12:40:00.000Z',
      },
    ],
    cap: 1,
  },
}

const showFief = async (
  overview: FiefOverview,
  overrides: Partial<ApiClient> = {},
): Promise<void> => {
  renderAppAt(
    knownFiefPath,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: overview }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const goalCard = (): HTMLElement => screen.getByRole('article', { name: copy.goal.title })

const dismissButton = (): HTMLElement =>
  within(goalCard()).getByRole('button', { name: copy.goal.dismiss })

it('shows the next goal with what is missing', async () => {
  await showFief(barracksShortOfIronAndPeasants)

  expect(within(goalCard()).getByText('Meta 9 de 9')).toBeDefined()
  expect(within(goalCard()).getByText('Levanta un cuartel.')).toBeDefined()
  expect(within(goalCard()).getByText('Te faltan 30 de hierro.')).toBeDefined()
  expect(within(goalCard()).getByText('Te falta 1 campesino libre.')).toBeDefined()
})

it('reads underway while the goal level builds', async () => {
  await showFief(sawmillLevelTwoUnderway)

  expect(within(goalCard()).getByText('Sube el aserradero a nivel 2.')).toBeDefined()
  expect(within(goalCard()).getByText('Ya está encargada.')).toBeDefined()
})

it('reads ready when nothing is missing', async () => {
  await showFief(farmWithNothingMissing)

  expect(within(goalCard()).getByText('Tienes lo que hace falta.')).toBeDefined()
})

it('reads the full queue instead of ready when no work can be ordered', async () => {
  await showFief(farmBehindAFullQueue)

  expect(within(goalCard()).getByText(copy.refusals.QueueFull)).toBeDefined()
  expect(within(goalCard()).queryByText('Tienes lo que hace falta.')).toBeNull()
})

it('shows no goal card without a goal', async () => {
  await showFief(knownFief)

  expect(screen.queryByRole('article', { name: copy.goal.title })).toBeNull()
  expect(screen.queryByText(copy.goal.title)).toBeNull()
})

it('removes the goal card after Descartar', async () => {
  const dismissGuidance = vi.fn(async () => undefined)
  await showFief(barracksShortOfIronAndPeasants, { dismissGuidance })

  fireEvent.click(dismissButton())
  await passSeconds(0)

  expect(dismissGuidance).toHaveBeenCalledWith(knownFief.id)
  expect(screen.queryByRole('article', { name: copy.goal.title })).toBeNull()
})

it('keeps the goal card when Descartar is refused', async () => {
  await showFief(barracksShortOfIronAndPeasants, {
    dismissGuidance: async () => 'Unexpected',
  })

  fireEvent.click(dismissButton())
  await passSeconds(0)

  expect(within(goalCard()).getByRole('alert').textContent).toBe(copy.refusals.Unexpected)
})

it('sends Descartar once on a double click', async () => {
  const dismissGuidance = vi.fn(async () => undefined)
  await showFief(barracksShortOfIronAndPeasants, { dismissGuidance })

  const button = dismissButton()
  await act(async () => {
    fireEvent.click(button)
    fireEvent.click(button)
  })

  expect(dismissGuidance).toHaveBeenCalledTimes(1)
})

it('keeps the goal of the other fief after Descartar', async () => {
  const otherFiefId = '4f1e2d3c-6b5a-4978-8a1b-2c3d4e5f6a7b'
  const otherFief: FiefOverview = {
    ...sawmillLevelTwoUnderway,
    id: otherFiefId,
    name: 'Sotoverde del Páramo',
    coordinates: { kingdom: 1, province: 2, plot: 7 },
  }
  await showFief(barracksShortOfIronAndPeasants, {
    fief: async (fiefId) => ({
      ok: true,
      value: fiefId === otherFiefId ? otherFief : barracksShortOfIronAndPeasants,
    }),
    fiefs: async () => ({
      ok: true,
      value: {
        fiefs: [
          {
            id: otherFiefId,
            name: otherFief.name,
            coordinates: otherFief.coordinates,
            freeSlots: [],
            fullStores: [],
          },
          {
            id: knownFief.id,
            name: knownFief.name,
            coordinates: knownFief.coordinates,
            freeSlots: [],
            fullStores: [],
          },
        ],
      },
    }),
  })

  fireEvent.click(dismissButton())
  await passSeconds(0)
  const switcher = screen.getByRole('navigation', { name: copy.shell.fiefSwitcher.label })
  fireEvent.click(within(switcher).getByRole('link', { name: /Sotoverde del Páramo/ }))
  await passSeconds(0)

  expect(within(goalCard()).getByText('Sube el aserradero a nivel 2.')).toBeDefined()
})
