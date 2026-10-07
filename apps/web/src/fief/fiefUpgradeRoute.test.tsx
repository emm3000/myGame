import type { BuildingKind, FiefOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'
import { accessibleDescriptionOf } from '../design-system/accessibleDescriptionOf.testSupport'
import { slotTrackFill } from './slotTrackFill.testSupport'

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
  renderAppAt(knownFiefPath, apiClient)
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
  peasants: {
    supplied: 12,
    occupied: 5,
    free: 7,
    projectedSupplied: 12,
    projectedOccupied: 6,
    projectedFree: 6,
    lowestFree: 6,
  },
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    startedAt: '2026-09-22T12:00:00.000Z',
    finishesAt: '2026-09-22T12:03:12.000Z',
  },
}

it('starts an upgrade and shows the slot busy', async () => {
  const enqueueUpgrade = vi.fn(async () => ({ ok: true as const, value: sawmillUpgradeUnderWay }))
  await showFief(signedInClient({ enqueueUpgrade }))

  fireEvent.click(upgradeButtonOf('sawmill'))
  await passSeconds(0)

  expect(enqueueUpgrade).toHaveBeenCalledWith(knownFief.id, 'sawmill')
  expect(screen.getByText(copy.names.busySlot)).toBeDefined()
  expect(screen.getByRole('timer').textContent).toContain('3 min')
})

it('starts the track empty on the overview an enqueue answers', async () => {
  const enqueueUpgrade = vi.fn(async () => ({ ok: true as const, value: sawmillUpgradeUnderWay }))
  await showFief(signedInClient({ enqueueUpgrade }))

  fireEvent.click(upgradeButtonOf('sawmill'))
  await passSeconds(0)

  expect(slotTrackFill()).toBe('0')
})

it('shows the Spanish reason when the queue is full', async () => {
  const enqueueUpgrade = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: false,
    refusal: 'QueueFull',
  })
  await showFief(signedInClient({ enqueueUpgrade }))

  fireEvent.click(upgradeButtonOf('quarry'))
  await passSeconds(0)

  expect(within(cardOf('quarry')).getByRole('alert').textContent).toBe(
    'Ya no caben más obras en espera. Espera a que avance alguna.',
  )
  expect(within(cardOf('sawmill')).queryByRole('alert')).toBeNull()
})

const threeWaitingBehindSawmill: FiefOverview = {
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
      {
        building: 'ironMine',
        targetLevel: 1,
        startsAt: '2026-09-22T12:09:36.000Z',
        finishesAt: '2026-09-22T12:12:48.000Z',
      },
    ],
    cap: 4,
  },
}

const queueFullBehindSawmill: FiefOverview = {
  ...threeWaitingBehindSawmill,
  queue: {
    ...threeWaitingBehindSawmill.queue,
    entries: [
      ...threeWaitingBehindSawmill.queue.entries,
      {
        building: 'warehouse',
        targetLevel: 1,
        startsAt: '2026-09-22T12:12:48.000Z',
        finishesAt: '2026-09-22T12:16:00.000Z',
      },
    ],
  },
}

it('disables every upgrade button with the reason while the build queue is full', async () => {
  await showFief(
    signedInClient({ fief: async () => ({ ok: true, value: queueFullBehindSawmill }) }),
  )

  for (const building of ['sawmill', 'quarry', 'ironMine', 'farm', 'warehouse'] as const) {
    const upgradeButton = within(cardOf(building)).getByRole('button', {
      name: 'Mejorar · 3:12',
      description: 'Ya no caben más obras en espera. Espera a que avance alguna.',
    })
    expect(upgradeButton.getAttribute('aria-disabled')).toBe('true')
  }
})

it('shows under each card why the full build queue refuses the upgrade', async () => {
  await showFief(
    signedInClient({ fief: async () => ({ ok: true, value: queueFullBehindSawmill }) }),
  )

  expect(
    within(cardOf('quarry')).getByText(
      'Ya no caben más obras en espera. Espera a que avance alguna.',
    ),
  ).toBeDefined()
})

it('refuses a card for the full build queue before its missing resources', async () => {
  const brokeWithFullQueue: FiefOverview = {
    ...queueFullBehindSawmill,
    resources: {
      ...queueFullBehindSawmill.resources,
      wood: { ...queueFullBehindSawmill.resources.wood, amount: 0 },
    },
  }
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: brokeWithFullQueue }) }))

  expect(
    within(cardOf('quarry')).getByRole('button', {
      name: 'Mejorar · 3:12',
      description: 'Ya no caben más obras en espera. Espera a que avance alguna.',
    }),
  ).toBeDefined()
})

it('refuses a card for the full build queue before its missing peasants', async () => {
  const nobodyFreeWithFullQueue: FiefOverview = {
    ...queueFullBehindSawmill,
    peasants: { ...queueFullBehindSawmill.peasants, projectedOccupied: 12, projectedFree: 0 },
  }
  await showFief(
    signedInClient({ fief: async () => ({ ok: true, value: nobodyFreeWithFullQueue }) }),
  )

  expect(
    within(cardOf('quarry')).getByRole('button', {
      name: 'Mejorar · 3:12',
      description: 'Ya no caben más obras en espera. Espera a que avance alguna.',
    }),
  ).toBeDefined()
})

it('keeps the upgrade buttons enabled while the build queue has room', async () => {
  await showFief(
    signedInClient({ fief: async () => ({ ok: true, value: threeWaitingBehindSawmill }) }),
  )

  expect(upgradeButtonOf('quarry').hasAttribute('aria-disabled')).toBe(false)
})

it('disables a card the free peasants cannot staff', async () => {
  const twoFreePeasants: FiefOverview = {
    ...knownFief,
    peasants: {
      supplied: 12,
      occupied: 10,
      free: 2,
      projectedSupplied: 12,
      projectedOccupied: 10,
      projectedFree: 2,
      lowestFree: 2,
    },
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
    name: 'Mejorar · 2:00',
    description: 'Necesitas 3 campesinos libres y tienes 2.',
  })
  expect(farmButton.getAttribute('aria-disabled')).toBe('true')
  expect(upgradeButtonOf('sawmill').hasAttribute('aria-disabled')).toBe(false)
})

it('checks a card against the free peasants left after the waiting upgrades', async () => {
  const twoFreeAfterQueue: FiefOverview = {
    ...knownFief,
    peasants: {
      supplied: 12,
      occupied: 4,
      free: 8,
      projectedSupplied: 12,
      projectedOccupied: 10,
      projectedFree: 2,
      lowestFree: 2,
    },
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
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: twoFreeAfterQueue }) }))

  const farmButton = within(cardOf('farm')).getByRole('button', {
    name: 'Mejorar · 2:00',
    description: 'Necesitas 3 campesinos libres y tienes 2.',
  })
  expect(farmButton.getAttribute('aria-disabled')).toBe('true')
})

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

it('starts at most one upgrade on a double click', async () => {
  const answer = deferred<ApiOutcome<FiefOverview>>()
  const enqueueUpgrade = vi.fn(() => answer.promise)
  await showFief(signedInClient({ enqueueUpgrade }))

  fireEvent.click(upgradeButtonOf('sawmill'))
  fireEvent.click(upgradeButtonOf('sawmill'))
  answer.resolve({ ok: true, value: sawmillUpgradeUnderWay })
  await passSeconds(0)

  expect(enqueueUpgrade).toHaveBeenCalledTimes(1)
})

it('disables every card while an upgrade is being started', async () => {
  const answer = deferred<ApiOutcome<FiefOverview>>()
  await showFief(signedInClient({ enqueueUpgrade: () => answer.promise }))

  fireEvent.click(upgradeButtonOf('sawmill'))
  await passSeconds(0)

  expect(upgradeButtonOf('quarry').getAttribute('aria-disabled')).toBe('true')
})

it('clears a refusal once a fresh read of the fief arrives', async () => {
  const reads = [knownFief, { ...knownFief, readAt: '2026-09-22T12:01:00.000Z' }]
  const fief = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: true,
    value: reads.shift() ?? knownFief,
  })
  const enqueueUpgrade = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: false,
    refusal: 'QueueFull',
  })
  await showFief(signedInClient({ fief, enqueueUpgrade }))
  fireEvent.click(upgradeButtonOf('quarry'))
  await passSeconds(0)
  expect(within(cardOf('quarry')).queryByRole('alert')).not.toBeNull()

  await passSeconds(60)

  expect(within(cardOf('quarry')).queryByRole('alert')).toBeNull()
})

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

it('disables a card the fief cannot afford', async () => {
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: shortOfStoneAndIron }) }))

  expect(upgradeButtonOf('ironMine').getAttribute('aria-disabled')).toBe('true')
})

it('names each missing amount on the button of a card the fief cannot afford', async () => {
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: shortOfStoneAndIron }) }))

  expect(
    within(cardOf('ironMine')).getByRole('button', {
      name: 'Mejorar · 1:30',
      description: 'Te faltan 15 de piedra y 40 de hierro. lista en 7 min',
    }),
  ).toBeDefined()
})

it('shows a building at its highest level as finished', async () => {
  const warehouseAtTop: FiefOverview = {
    ...knownFief,
    buildings: { ...knownFief.buildings, warehouse: { level: 10, nextLevel: null } },
  }
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: warehouseAtTop }) }))

  const warehouseButton = upgradeButtonOf('warehouse')
  expect(warehouseButton.textContent).toBe('Nivel máximo')
  expect(warehouseButton.getAttribute('aria-disabled')).toBe('true')
})

it('keeps a blocked action in the tab order', async () => {
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: shortOfStoneAndIron }) }))

  const blockedButton = upgradeButtonOf('ironMine')
  blockedButton.focus()

  expect(document.activeElement).toBe(blockedButton)
  expect(blockedButton.getAttribute('aria-disabled')).toBe('true')
})

it('announces a blocked action as unavailable with its reason', async () => {
  await showFief(
    signedInClient({ fief: async () => ({ ok: true, value: queueFullBehindSawmill }) }),
  )

  const blockedButton = within(cardOf('quarry')).getByRole('button', {
    name: 'Mejorar · 3:12',
    description: copy.refusals.QueueFull,
  })

  expect(blockedButton.getAttribute('aria-disabled')).toBe('true')
})

it('sends no request when a blocked action is pressed', async () => {
  const enqueueUpgrade = vi.fn(async () => ({ ok: true as const, value: knownFief }))
  await showFief(
    signedInClient({
      fief: async () => ({ ok: true, value: shortOfStoneAndIron }),
      enqueueUpgrade,
    }),
  )

  fireEvent.click(upgradeButtonOf('ironMine'))
  await passSeconds(0)

  expect(enqueueUpgrade).not.toHaveBeenCalled()
})

const ironMineShortOfIron = (ironAtRead: number): FiefOverview => ({
  ...knownFief,
  resources: {
    ...knownFief.resources,
    iron: { ...knownFief.resources.iron, amount: ironAtRead, ratePerHour: 5 },
  },
  buildings: {
    ...knownFief.buildings,
    ironMine: {
      level: 0,
      nextLevel: {
        level: 1,
        cost: { wood: 200, stone: 120, iron: 60, gold: 0, food: 0 },
        durationSeconds: 1200,
        peasants: 1,
      },
    },
  },
})

it('reads lista with the clock when only resources are short', async () => {
  await showFief(
    signedInClient({ fief: async () => ({ ok: true, value: ironMineShortOfIron(30) }) }),
  )

  expect(accessibleDescriptionOf(upgradeButtonOf('ironMine'))).toBe(
    'Te faltan 30 de hierro. lista 20:00',
  )
  expect(within(cardOf('ironMine')).getByText('lista 20:00')).toBeDefined()
})

it('reads lista with the time left when the ready hour is within the hour', async () => {
  await showFief(
    signedInClient({ fief: async () => ({ ok: true, value: ironMineShortOfIron(56) }) }),
  )

  expect(accessibleDescriptionOf(upgradeButtonOf('ironMine'))).toBe(
    'Te faltan 4 de hierro. lista en 48 min',
  )
})

it('reads the later ready hour of two short resources', async () => {
  const shortOfIron = ironMineShortOfIron(30)
  const shortOfWoodAndIron: FiefOverview = {
    ...shortOfIron,
    resources: {
      ...shortOfIron.resources,
      wood: { ...shortOfIron.resources.wood, amount: 150, ratePerHour: 40 },
    },
  }
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: shortOfWoodAndIron }) }))

  expect(accessibleDescriptionOf(upgradeButtonOf('ironMine'))).toBe(
    'Te faltan 50 de madera y 30 de hierro. lista 20:00',
  )
})

it('reads no lista when peasants are short too', async () => {
  const shortOfIron = ironMineShortOfIron(30)
  const nobodyFree: FiefOverview = {
    ...shortOfIron,
    peasants: { ...shortOfIron.peasants, projectedOccupied: 12, projectedFree: 0 },
  }
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: nobodyFree }) }))

  expect(accessibleDescriptionOf(upgradeButtonOf('ironMine'))).toBe(
    'Necesitas 1 campesino libre y tienes 0.',
  )
  expect(within(cardOf('ironMine')).queryByText(/lista/)).toBeNull()
})

it('reads no lista when the cost exceeds the capacity', async () => {
  const shortOfIron = ironMineShortOfIron(30)
  const ironStoreTooSmall: FiefOverview = {
    ...shortOfIron,
    resources: {
      ...shortOfIron.resources,
      iron: { ...shortOfIron.resources.iron, capacity: 50 },
    },
  }
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: ironStoreTooSmall }) }))

  expect(accessibleDescriptionOf(upgradeButtonOf('ironMine'))).toBe('Te faltan 30 de hierro.')
})

it('reads no lista when a short resource does not accrue', async () => {
  const shortOfIron = ironMineShortOfIron(30)
  const noIronComing: FiefOverview = {
    ...shortOfIron,
    resources: {
      ...shortOfIron.resources,
      iron: { ...shortOfIron.resources.iron, ratePerHour: 0 },
    },
  }
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: noIronComing }) }))

  expect(accessibleDescriptionOf(upgradeButtonOf('ironMine'))).toBe('Te faltan 30 de hierro.')
})

it('reads lista at the next whole minute when the ready instant falls between minutes', async () => {
  const readBetweenMinutes: FiefOverview = {
    ...ironMineShortOfIron(30),
    readAt: '2026-09-22T12:00:40.000Z',
  }
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: readBetweenMinutes }) }))

  expect(accessibleDescriptionOf(upgradeButtonOf('ironMine'))).toBe(
    'Te faltan 30 de hierro. lista 20:01',
  )
})

it('reads lista a minute later when the accrual falls just short of the cost at the computed minute', async () => {
  const shortOfIron = ironMineShortOfIron(12.5)
  const slowIron: FiefOverview = {
    ...shortOfIron,
    resources: {
      ...shortOfIron.resources,
      iron: { ...shortOfIron.resources.iron, ratePerHour: 0.7 },
    },
    buildings: {
      ...shortOfIron.buildings,
      ironMine: {
        level: 0,
        nextLevel: {
          level: 1,
          cost: { wood: 200, stone: 120, iron: 30, gold: 0, food: 0 },
          durationSeconds: 1200,
          peasants: 1,
        },
      },
    },
  }
  await showFief(signedInClient({ fief: async () => ({ ok: true, value: slowIron }) }))

  expect(accessibleDescriptionOf(upgradeButtonOf('ironMine'))).toBe(
    'Te faltan 18 de hierro. lista mañana 15:01',
  )
})
