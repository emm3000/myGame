import type { BuildingKind, FiefOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
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

const signedInClient = (overrides: Partial<ApiClient>): ApiClient =>
  stubApiClient({ currentPlayer: async () => knownPlayer, ...overrides })

const showFief = async (apiClient: ApiClient): Promise<void> => {
  renderAppAt('/', apiClient)
  await passSeconds(0)
}

const cardOf = (building: BuildingKind): HTMLElement =>
  screen.getByRole('listitem', { name: copy.names.buildings[building] })

const upgradeButtonOf = (building: BuildingKind): HTMLElement =>
  within(cardOf(building)).getByRole('button')

const sawmillUpgradeUnderWay: FiefOverview = {
  ...knownFief,
  resources: {
    ...knownFief.resources,
    wood: { ...knownFief.resources.wood, amount: 910 },
    stone: { ...knownFief.resources.stone, amount: 777 },
  },
  peasants: { supplied: 12, occupied: 5, free: 7 },
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    finishesAt: '2026-09-22T12:03:12.000Z',
  },
}

it('starts an upgrade and shows the slot busy', async () => {
  const enqueueUpgrade = vi.fn(async () => ({ ok: true as const, value: sawmillUpgradeUnderWay }))
  await showFief(signedInClient({ enqueueUpgrade }))

  fireEvent.click(upgradeButtonOf('sawmill'))
  await passSeconds(0)

  expect(enqueueUpgrade).toHaveBeenCalledWith('sawmill')
  expect(screen.getByText(copy.names.busySlot)).toBeDefined()
  expect(screen.getByRole('timer').textContent).toContain('3:12')
  await passSeconds(2)
  expect(screen.getByRole('timer').textContent).toContain('3:10')
})

it('shows the Spanish reason when the slot is busy', async () => {
  const enqueueUpgrade = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: false,
    refusal: 'SlotBusy',
  })
  await showFief(signedInClient({ enqueueUpgrade }))

  fireEvent.click(upgradeButtonOf('quarry'))
  await passSeconds(0)

  expect(within(cardOf('quarry')).getByRole('alert').textContent).toBe(
    'Ya tienes una obra en marcha. Espera a que termine.',
  )
  expect(within(cardOf('sawmill')).queryByRole('alert')).toBeNull()
})

it('disables a card the free peasants cannot staff', async () => {
  const twoFreePeasants: FiefOverview = {
    ...knownFief,
    peasants: { supplied: 12, occupied: 10, free: 2 },
    buildings: {
      ...knownFief.buildings,
      farm: {
        level: 1,
        nextLevel: {
          level: 2,
          cost: { wood: 50, stone: 30, iron: 0, gold: 0, food: 0 },
          durationSeconds: 120,
          peasants: 3,
        },
      },
    },
  }
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: twoFreePeasants }) }))

  const farmButton = within(cardOf('farm')).getByRole('button', {
    name: 'Mejorar · 2:00. Necesitas 3 campesinos libres y tienes 2.',
  })
  expect(farmButton.hasAttribute('disabled')).toBe(true)
  expect(upgradeButtonOf('sawmill').hasAttribute('disabled')).toBe(false)
})

it('starts at most one upgrade on a double click', async () => {
  const enqueueUpgrade = vi.fn(
    (): Promise<ApiOutcome<FiefOverview>> =>
      new Promise((answer) => {
        setTimeout(() => answer({ ok: true, value: sawmillUpgradeUnderWay }), 500)
      }),
  )
  await showFief(signedInClient({ enqueueUpgrade }))

  fireEvent.click(upgradeButtonOf('sawmill'))
  fireEvent.click(upgradeButtonOf('sawmill'))
  await passSeconds(1)

  expect(enqueueUpgrade).toHaveBeenCalledTimes(1)
})

it('disables a card the fief cannot afford and names each missing amount', async () => {
  const shortOfStoneAndIron: FiefOverview = {
    ...knownFief,
    buildings: {
      ...knownFief.buildings,
      ironMine: {
        level: 0,
        nextLevel: {
          level: 1,
          cost: { wood: 60, stone: 815, iron: 340, gold: 0, food: 0 },
          durationSeconds: 90,
          peasants: 1,
        },
      },
    },
  }
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: shortOfStoneAndIron }) }))

  const ironMineButton = within(cardOf('ironMine')).getByRole('button', {
    name: 'Mejorar · 1:30. Te faltan 15 de piedra y 40 de hierro.',
  })
  expect(ironMineButton.hasAttribute('disabled')).toBe(true)
})

it('shows a building at its highest level as finished', async () => {
  const warehouseAtTop: FiefOverview = {
    ...knownFief,
    buildings: { ...knownFief.buildings, warehouse: { level: 10, nextLevel: null } },
  }
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: warehouseAtTop }) }))

  const warehouseButton = upgradeButtonOf('warehouse')
  expect(warehouseButton.textContent).toBe('Nivel máximo')
  expect(warehouseButton.hasAttribute('disabled')).toBe(true)
})
