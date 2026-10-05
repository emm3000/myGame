import type { FiefOverview } from '@mygame/contracts'
import { act, screen, within } from '@testing-library/react'
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

const instantAfterRead = (seconds: number): string =>
  new Date(Date.parse(knownFief.readAt) + seconds * 1000).toISOString()

const cargoArrivingIn = (seconds: number): FiefOverview['incomingCargo'] => ({
  fromFiefId: '6f1c2a5e-3b7d-4c8e-9a10-2b3c4d5e6f70',
  from: { name: 'Sotoverde', province: 3, plot: 12 },
  cargo: { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 },
  arrivesAt: instantAfterRead(seconds),
})

const steadyWood = (amount: number): FiefOverview['resources'] => ({
  ...knownFief.resources,
  wood: { amount, ratePerHour: 0, capacity: 20000 },
})

const awaitingCargo: FiefOverview = { ...knownFief, incomingCargo: cargoArrivingIn(450) }

const showFief = async (fief: ApiClient['fief']): Promise<void> => {
  renderAppAt(knownFiefPath, stubApiClient({ currentPlayer: async () => knownPlayer, fief }))
  await passSeconds(0)
}

const cargoCard = (): HTMLElement | null =>
  screen.queryByRole('article', { name: copy.fief.incomingCargo })

const presentCargoCard = (): HTMLElement => {
  const card = cargoCard()
  expect(card).not.toBeNull()
  return card as HTMLElement
}

it('shows the cargo on its way with its origin and amounts', async () => {
  await showFief(async () => ({ ok: true, value: awaitingCargo }))

  const card = presentCargoCard()
  expect(within(card).getByText('Desde Sotoverde, provincia 3, parcela 12')).toBeDefined()
  expect(within(card).getByText('300 de madera, 200 de piedra y 220 de hierro')).toBeDefined()
})

it('shows the convoy art on the cargo card', async () => {
  await showFief(async () => ({ ok: true, value: awaitingCargo }))

  const art = within(presentCargoCard()).getByRole('presentation')
  expect(art.getAttribute('src')).toBe('/art/convoys/convoy.png')
  expect(art.getAttribute('loading')).toBe('lazy')
})

it('counts down to the arrival', async () => {
  await showFief(async () => ({ ok: true, value: awaitingCargo }))
  const countdown = within(presentCargoCard()).getByRole('timer')
  expect(within(countdown).getByText('Llegada en')).toBeDefined()
  expect(within(countdown).getByText('7:30')).toBeDefined()

  await passSeconds(30)

  expect(within(within(presentCargoCard()).getByRole('timer')).getByText('7:00')).toBeDefined()
})

it('reads the overview again at the arrival', async () => {
  const fief = vi
    .fn<ApiClient['fief']>()
    .mockImplementationOnce(async () => ({
      ok: true,
      value: { ...knownFief, resources: steadyWood(1000), incomingCargo: cargoArrivingIn(40) },
    }))
    .mockImplementation(async () => ({
      ok: true,
      value: {
        ...knownFief,
        resources: steadyWood(1300),
        incomingCargo: null,
        readAt: new Date(Date.now()).toISOString(),
      },
    }))
  await showFief(fief)

  await passSeconds(40)

  expect(cargoCard()).toBeNull()
  const woodCell = screen.getByRole('listitem', { name: copy.names.resources.wood })
  expect(within(woodCell).getByText('1 300')).toBeDefined()
})

it('shows no cargo card without a cargo on its way', async () => {
  await showFief(async () => ({ ok: true, value: knownFief }))

  expect(cargoCard()).toBeNull()
})
