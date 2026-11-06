import {
  namesPlacesFarm,
  namesPlacesHomes,
  namesPlacesSchool,
  refusalNotEnoughResources,
  refusalWaitingListFull,
  townWorkRefund,
  townWorkStop,
  townWorkStopOf,
  townWorkWaitingList,
} from '@mygame/catalog'
import type { BuildingWork, StopBuildingWork, TownOverview } from '@mygame/contracts/town'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { accessibleDescriptionOf } from '../design-system/accessibleDescriptionOf.testSupport'

const readAt = Date.parse(knownTown.readAt)

beforeEach(() => {
  vi.useFakeTimers({ now: readAt })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const instantAfter = (seconds: number): string => new Date(readAt + seconds * 1000).toISOString()

const workOn = (
  building: BuildingWork['building'],
  level: number,
  startsInSeconds: number,
  finishesInSeconds: number,
): BuildingWork => ({
  building,
  level,
  cost: { money: 60, food: 40, power: 0, material: 80 },
  startsAt: instantAfter(startsInSeconds),
  finishesAt: instantAfter(finishesInSeconds),
})

const homesBeingBuilt = workOn('homes', 2, -60, 240)

const withWork = (
  slot: BuildingWork | null,
  waitingList: ReadonlyArray<BuildingWork>,
): TownOverview => ({
  ...knownTown,
  work: { ...knownTown.work, slot, waitingList: [...waitingList] },
})

const showTown = async (town: TownOverview, overrides: Partial<ApiClient> = {}): Promise<void> => {
  renderAppAt(
    '/',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      town: async () => ({ ok: true, value: town }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const placeCard = (name: string): HTMLElement => screen.getByRole('listitem', { name })

const buildButtonOf = (name: string): HTMLElement =>
  within(placeCard(name)).getByRole('button', { name: /^Construir nivel/ })

it('offers the next level with its cost and duration', async () => {
  await showTown(knownTown)

  const farm = placeCard(namesPlacesFarm())
  expect(within(farm).getByRole('button', { name: 'Construir nivel 1 · 5:00' })).toBeDefined()
  expect(within(farm).getByText('Gente trabajando: +2')).toBeDefined()
  expect(within(farm).getByText('de dinero', { exact: false }).parentElement?.textContent).toBe(
    '60 de dinero',
  )
  expect(within(farm).getByText('de material', { exact: false }).parentElement?.textContent).toBe(
    '80 de material',
  )
})

it('starts the work of the level offered', async () => {
  const started: Array<string> = []
  await showTown(knownTown, {
    startBuildingWork: async (building) => {
      started.push(building)
      return { ok: true, value: withWork(workOn('farm', 1, 0, 300), []) }
    },
  })

  fireEvent.click(buildButtonOf(namesPlacesFarm()))
  await passSeconds(0)

  expect(started).toEqual(['farm'])
  expect(screen.getByRole('timer').textContent).toBe('5 min')
})

const waitingBuildPill = async (): Promise<HTMLElement> => {
  await showTown(knownTown, {
    startBuildingWork: () => new Promise<ApiOutcome<TownOverview>>(() => undefined),
  })
  fireEvent.click(buildButtonOf(namesPlacesFarm()))
  await passSeconds(0)
  return buildButtonOf(namesPlacesFarm())
}

it('holds a waiting build pill at its idle label width', async () => {
  expect((await waitingBuildPill()).className.split(' ')).toContain('px-2')
})

it('draws the clock on a waiting build pill', async () => {
  expect((await waitingBuildPill()).querySelector('svg')).not.toBeNull()
})

it('marks a waiting build pill as busy', async () => {
  expect((await waitingBuildPill()).getAttribute('aria-busy')).toBe('true')
})

it('disables a level the stocks cannot pay and names the shortfall', async () => {
  await showTown({
    ...knownTown,
    stocks: { ...knownTown.stocks, material: { amount: 30, ratePerHour: 0, capacity: 5000 } },
  })

  const button = buildButtonOf(namesPlacesFarm())
  expect(button.getAttribute('aria-disabled')).toBe('true')
  expect(accessibleDescriptionOf(button)).toBe('Necesitas 50 de material más.')
})

it('disables a level the free people cannot staff', async () => {
  await showTown({ ...knownTown, people: { supplied: 97, free: 1, atWork: 96 } })

  const button = buildButtonOf(namesPlacesFarm())
  expect(button.getAttribute('aria-disabled')).toBe('true')
  expect(accessibleDescriptionOf(button)).toBe('Gente necesaria: 2. Libre: 1.')
})

it('agrees the free people with their count', async () => {
  await showTown({ ...knownTown, people: { supplied: 96, free: 0, atWork: 96 } })

  expect(accessibleDescriptionOf(buildButtonOf(namesPlacesFarm()))).toBe(
    'Gente necesaria: 2. Libres: 0.',
  )
})

it('shows the slot busy with its countdown', async () => {
  await showTown(withWork(homesBeingBuilt, []))

  expect(screen.getByText(namesPlacesHomes(), { selector: 'span' })).toBeDefined()
  expect(screen.getByRole('timer').textContent).toBe('4 min')
})

it('shows work waiting behind the slot in order', async () => {
  await showTown(
    withWork(homesBeingBuilt, [workOn('school', 2, 240, 600), workOn('farm', 1, 600, 900)]),
  )

  const waiting = screen.getByRole('list', { name: townWorkWaitingList() })
  const entries = within(waiting)
    .getAllByRole('listitem')
    .map((entry) => entry.textContent ?? '')
  expect(entries[0]).toContain(namesPlacesSchool())
  expect(entries[1]).toContain(namesPlacesFarm())
})

it('blocks every level while the waiting list is full', async () => {
  await showTown(
    withWork(homesBeingBuilt, [workOn('school', 2, 240, 600), workOn('farm', 1, 600, 900)]),
  )

  expect(accessibleDescriptionOf(buildButtonOf(namesPlacesFarm()))).toBe(
    refusalWaitingListFull({ cap: 2 }),
  )
})

it('stops the work and shows the refund it promises', async () => {
  const stopped: Array<StopBuildingWork> = []
  await showTown(withWork(homesBeingBuilt, []), {
    stopBuildingWork: async (target) => {
      stopped.push(target)
      return { ok: true, value: knownTown }
    },
  })
  expect(screen.getByText(townWorkRefund())).toBeDefined()

  fireEvent.click(
    screen.getByRole('button', { name: townWorkStopOf({ place: namesPlacesHomes(), level: 2 }) }),
  )
  await passSeconds(0)

  expect(stopped).toEqual([{ building: 'homes', level: 2 }])
  expect(screen.queryByRole('button', { name: new RegExp(`^${townWorkStop()}`) })).toBeNull()
})

it('stops work once on a double click', async () => {
  let answer: (outcome: ApiOutcome<TownOverview>) => void = () => undefined
  const stopBuildingWork = vi.fn(
    () =>
      new Promise<ApiOutcome<TownOverview>>((resolve) => {
        answer = resolve
      }),
  )
  await showTown(withWork(homesBeingBuilt, []), { stopBuildingWork })

  const stop = screen.getByRole('button', {
    name: townWorkStopOf({ place: namesPlacesHomes(), level: 2 }),
  })
  act(() => {
    fireEvent.click(stop)
    fireEvent.click(stop)
  })
  await act(async () => answer({ ok: true, value: knownTown }))

  expect(stopBuildingWork).toHaveBeenCalledTimes(1)
})

it('shows a finished level after the next read', async () => {
  const finished: TownOverview = {
    ...knownTown,
    buildings: {
      ...knownTown.buildings,
      homes: { ...knownTown.buildings.homes, level: 2 },
    },
    readAt: instantAfter(240),
  }
  let reads = 0
  await showTown(withWork(homesBeingBuilt, []), {
    town: async () => {
      reads += 1
      return { ok: true, value: reads === 1 ? withWork(homesBeingBuilt, []) : finished }
    },
  })
  expect(within(placeCard(namesPlacesHomes())).getByText('Nivel 1 · En construcción')).toBeDefined()

  await passSeconds(240)

  expect(within(placeCard(namesPlacesHomes())).getByText('Nivel 2')).toBeDefined()
})

it('shows a refused start with its message under the place', async () => {
  await showTown(knownTown, {
    startBuildingWork: async () => ({
      ok: false,
      refusal: 'NotEnoughResources',
      error: {
        kind: 'NotEnoughResources',
        params: { missing: { money: 0, food: 0, power: 0, material: 10 } },
      },
    }),
  })

  fireEvent.click(buildButtonOf(namesPlacesFarm()))
  await passSeconds(0)

  expect(within(placeCard(namesPlacesFarm())).getByRole('alert').textContent).toBe(
    refusalNotEnoughResources(),
  )
})
