import type { FiefOverview } from '@mygame/contracts'
import { act, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefList,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'
import { busySlot, slotTrackFill } from './slotTrackFill.testSupport'

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
  renderAppAt(knownFiefPath, apiClient)
  await passSeconds(0)
}

const woodCell = (): HTMLElement =>
  screen.getByRole('listitem', { name: copy.names.resources.wood })

const woodAtOnePerSecond: FiefOverview = {
  ...knownFief,
  resources: {
    ...knownFief.resources,
    wood: { amount: 1000, ratePerHour: 3600, capacity: 20000, fullAt: null },
  },
}

const servingOnceThenHolding = (overview: FiefOverview): ApiClient => {
  const reads = [overview]
  return stubApiClient({
    currentPlayer: async () => knownPlayer,
    fief: (): Promise<ApiOutcome<FiefOverview>> => {
      const next = reads.shift()
      return next === undefined
        ? new Promise(() => undefined)
        : Promise.resolve({ ok: true, value: next })
    },
  })
}

const sawmillFortyFiveSecondsFromFinish: FiefOverview = {
  ...woodAtOnePerSecond,
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    startedAt: '2026-09-22T11:58:00.000Z',
    finishesAt: '2026-09-22T12:00:45.000Z',
  },
}

it('keeps the amounts unchanged within a minute', async () => {
  await showFief(servingOnceThenHolding(woodAtOnePerSecond))

  await passSeconds(59)

  expect(within(woodCell()).getByText('1 000')).toBeDefined()
})

it('repaints every second in a slot last minute', async () => {
  await showFief(servingOnceThenHolding(sawmillFortyFiveSecondsFromFinish))

  await passSeconds(1)

  expect(within(busySlot()).getByRole('timer').textContent).toBe('0:44')
})

it('keeps the amounts unchanged while a slot ticks its last minute', async () => {
  await showFief(servingOnceThenHolding(sawmillFortyFiveSecondsFromFinish))

  await passSeconds(30)

  expect(within(woodCell()).getByText('1 000')).toBeDefined()
})

it('starts the seconds when a slot enters its last minute', async () => {
  const sawmillTwoMinutesFromFinish: FiefOverview = {
    ...knownFief,
    slot: {
      kind: 'busy',
      building: 'sawmill',
      targetLevel: 2,
      startedAt: '2026-09-22T11:58:00.000Z',
      finishesAt: '2026-09-22T12:02:00.000Z',
    },
  }
  await showFief(servingOnceThenHolding(sawmillTwoMinutesFromFinish))

  await passSeconds(61)

  expect(within(busySlot()).getByRole('timer').textContent).toBe('0:59')
})

it('advances the wood amount between reads from the server rate', async () => {
  await showFief(servingOnceThenHolding(woodAtOnePerSecond))

  await passSeconds(60)

  expect(woodCell().textContent).toContain('1 060')
})

it('stops the interpolated amount at the capacity', async () => {
  const woodTenSecondsFromFull: FiefOverview = {
    ...knownFief,
    resources: {
      ...knownFief.resources,
      wood: { amount: 19990, ratePerHour: 3600, capacity: 20000, fullAt: null },
    },
  }
  await showFief(servingOnceThenHolding(woodTenSecondsFromFull))

  await passSeconds(60)

  expect(within(woodCell()).getByText('20 000')).toBeDefined()
})

it('keeps an amount above the capacity where the read left it', async () => {
  const woodAboveCapacity: FiefOverview = {
    ...knownFief,
    resources: {
      ...knownFief.resources,
      wood: { amount: 1200, ratePerHour: 3600, capacity: 1000, fullAt: null },
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

const sawmillWithTwoWaiting: FiefOverview = {
  ...knownFief,
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    startedAt: '2026-09-22T12:00:00.000Z',
    finishesAt: '2026-09-22T12:03:12.000Z',
  },
  queue: {
    entries: [
      {
        building: 'quarry',
        targetLevel: 1,
        startsAt: '2026-09-22T12:03:12.000Z',
        finishesAt: '2026-09-22T12:05:42.000Z',
      },
      {
        building: 'sawmill',
        targetLevel: 3,
        startsAt: '2026-09-22T12:05:42.000Z',
        finishesAt: '2026-09-22T12:10:49.000Z',
      },
    ],
    cap: 4,
  },
}

const waitingUpgrades = (): ReadonlyArray<HTMLElement> =>
  within(screen.getByRole('list', { name: copy.names.buildQueue })).getAllByRole('listitem')

it('lists the waiting upgrades under the one in progress', async () => {
  await showFief(signedInClientServing(() => sawmillWithTwoWaiting))

  expect(
    waitingUpgrades().map((entry) => [
      within(entry).getByText(/Cantera|Aserradero/).textContent,
      within(entry).getByText(/nivel/).textContent,
    ]),
  ).toEqual([
    ['Cantera', 'nivel 1'],
    ['Aserradero', 'nivel 3'],
  ])
})

it('counts down each waiting upgrade between reads', async () => {
  await showFief(servingOnceThenHolding(sawmillWithTwoWaiting))

  await passSeconds(60)

  expect(waitingUpgrades().map((entry) => within(entry).getByRole('timer').textContent)).toEqual([
    '4 min',
    '9 min',
  ])
})

it('re-reads the fief when the countdown reaches zero', async () => {
  const fief = vi.fn(() => sawmillStartedNinetySecondsAgo)
  await showFief(signedInClientServing(fief))

  await passSeconds(30)

  expect(fief).toHaveBeenCalledTimes(2)
})

const quarryStartedWhenSawmillFinished: FiefOverview = {
  ...knownFief,
  buildings: { ...knownFief.buildings, sawmill: { ...knownFief.buildings.sawmill, level: 2 } },
  slot: {
    kind: 'busy',
    building: 'quarry',
    targetLevel: 1,
    startedAt: '2026-09-22T12:03:12.000Z',
    finishesAt: '2026-09-22T12:05:42.000Z',
  },
  queue: {
    entries: [
      {
        building: 'sawmill',
        targetLevel: 3,
        startsAt: '2026-09-22T12:05:42.000Z',
        finishesAt: '2026-09-22T12:10:49.000Z',
      },
    ],
    cap: 4,
  },
  readAt: '2026-09-22T12:03:15.000Z',
}

it('shows the next waiting upgrade in progress after the slot finishes', async () => {
  const reads = [sawmillWithTwoWaiting, quarryStartedWhenSawmillFinished]
  await showFief(signedInClientServing(() => reads.shift() ?? quarryStartedWhenSawmillFinished))

  await passSeconds(192)

  expect(within(busySlot()).getByText('Cantera')).toBeDefined()
  expect(slotTrackFill()).toBe('2')
  expect(waitingUpgrades()).toHaveLength(1)
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

const libraryCard = (): HTMLElement => screen.getByRole('listitem', { name: 'biblioteca' })

it('shows the library card with its Spanish label', async () => {
  await showFief(signedInClientServing(() => knownFief))

  expect(within(libraryCard()).getByRole('heading', { name: 'Biblioteca' })).toBeDefined()
})

it('shows the library art of its tier on the library card', async () => {
  const libraryAtLevelThree: FiefOverview = {
    ...knownFief,
    buildings: {
      ...knownFief.buildings,
      library: { ...knownFief.buildings.library, level: 3 },
    },
  }
  await showFief(signedInClientServing(() => libraryAtLevelThree))

  expect(within(libraryCard()).getByRole('presentation').getAttribute('src')).toMatch(
    /\/library-2\.png$/,
  )
})

const barracksCard = (): HTMLElement => screen.getByRole('listitem', { name: 'cuartel' })

it('shows the barracks card with its Spanish label', async () => {
  await showFief(signedInClientServing(() => knownFief))

  expect(within(barracksCard()).getByRole('heading', { name: 'Cuartel' })).toBeDefined()
})

it('shows the barracks art of its tier on the barracks card', async () => {
  const barracksAtLevelOne: FiefOverview = {
    ...knownFief,
    buildings: {
      ...knownFief.buildings,
      barracks: { ...knownFief.buildings.barracks, level: 1 },
    },
  }
  await showFief(signedInClientServing(() => barracksAtLevelOne))

  expect(within(barracksCard()).getByRole('presentation').getAttribute('src')).toMatch(
    /\/barracks-1\.png$/,
  )
})

const farmWaitingInFullQueue: FiefOverview = {
  ...knownFief,
  peasants: {
    supplied: 12,
    occupied: 4,
    free: 8,
    projectedSupplied: 15,
    projectedOccupied: 9,
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
  queue: {
    entries: [
      {
        building: 'farm',
        targetLevel: 2,
        startsAt: '2026-09-22T12:03:12.000Z',
        finishesAt: '2026-09-22T12:06:24.000Z',
      },
      {
        building: 'quarry',
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
      {
        building: 'warehouse',
        targetLevel: 1,
        startsAt: '2026-09-22T12:12:48.000Z',
        finishesAt: '2026-09-22T12:16:00.000Z',
      },
    ],
    cap: 4,
  },
}

const peasantCell = (): HTMLElement => screen.getByRole('listitem', { name: copy.names.peasants })

it('shows in the peasant cell the free peasants of the projected supply', async () => {
  await showFief(signedInClientServing(() => farmWaitingInFullQueue))

  expect(peasantCell().textContent).toMatch(/(?<!\d)6 \/ 15 libres/)
})

it('shows in the peasant cell the peasants the waiting upgrades will occupy', async () => {
  await showFief(signedInClientServing(() => farmWaitingInFullQueue))

  expect(peasantCell().textContent).toMatch(/(?<!\d)9 ocupados/)
})

const robledal = {
  id: '3e8d6f2b-1c4a-4b7e-9d5f-6a0b2c8e4f71',
  name: 'Robledal',
  coordinates: { kingdom: 1, province: 4, plot: 2 },
}

const signedInClientReading = (readFiefIds: Array<string>): ApiClient =>
  stubApiClient({
    currentPlayer: async () => knownPlayer,
    fiefs: async () => ({
      ok: true,
      value: {
        fiefs: [...knownFiefList.fiefs, { ...robledal, freeSlots: [], fullStores: [] }],
      },
    }),
    fief: async (fiefId) => {
      readFiefIds.push(fiefId)
      return { ok: true, value: fiefId === robledal.id ? { ...knownFief, ...robledal } : knownFief }
    },
  })

it('opens the first fief from the root', async () => {
  const readFiefIds: Array<string> = []
  renderAppAt('/', signedInClientReading(readFiefIds))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 2, name: knownFief.name })).toBeDefined()
  expect(readFiefIds).toEqual([knownFief.id])
})

it('reads the fief named in the URL', async () => {
  const readFiefIds: Array<string> = []
  renderAppAt(`/feudo/${robledal.id}`, signedInClientReading(readFiefIds))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 2, name: robledal.name })).toBeDefined()
  expect(readFiefIds).toEqual([robledal.id])
})

it('shows the fief not found line for an unknown id', async () => {
  const unknownFiefId = '6d1f0c3a-2b4e-4c5d-9e8f-7a6b5c4d3e2f'
  const apiClient = stubApiClient({
    currentPlayer: async () => knownPlayer,
    fief: async () => ({ ok: false, refusal: 'FiefNotFound' }),
  })
  renderAppAt(`/feudo/${unknownFiefId}`, apiClient)
  await passSeconds(0)

  expect(screen.getByText(copy.refusals.FiefNotFound)).toBeDefined()
})

it('shows the fief not found line for an id that is not a uuid', async () => {
  const readFiefIds: Array<string> = []
  renderAppAt('/feudo/robledal', signedInClientReading(readFiefIds))
  await passSeconds(0)

  expect(screen.getByText(copy.refusals.FiefNotFound)).toBeDefined()
  expect(readFiefIds).toEqual([])
})
