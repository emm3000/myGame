import { namesHiresTruck, namesHiresWorker } from '@mygame/catalog'
import type { PlaceHiringOrder, TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
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

const withOfficeAt = (level: number, town: TownOverview = knownTown): TownOverview => ({
  ...town,
  buildings: {
    ...town.buildings,
    office: { ...town.buildings.office, level },
  },
})

const officeTown = withOfficeAt(1)

const hiringWorkers = (
  delivered: number,
  count: number,
  town: TownOverview = officeTown,
): TownOverview => ({
  ...town,
  hiring: {
    ...town.hiring,
    order: {
      hire: 'worker',
      count,
      delivered,
      secondsPerHire: 60,
      startedAt: instantAfter(-60 * delivered),
      endsAt: instantAfter(60 * (count - delivered)),
    },
  },
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

const hireCard = (name: string): HTMLElement => screen.getByRole('listitem', { name })

it('hires workers from the office', async () => {
  const placed: Array<PlaceHiringOrder> = []
  await showTown(officeTown, {
    placeHiringOrder: async (order) => {
      placed.push(order)
      return { ok: true, value: hiringWorkers(0, 3) }
    },
  })

  const workers = hireCard(namesHiresWorker())
  fireEvent.change(within(workers).getByLabelText('Trabajadores a contratar'), {
    target: { value: '3' },
  })
  fireEvent.click(within(workers).getByRole('button', { name: 'Contratar 3 trabajadores · 3:00' }))
  await passSeconds(0)

  expect(placed).toEqual([{ hire: 'worker', count: 3 }])
  expect(screen.getByText('0 de 3 contratados')).toBeDefined()
})

it('locks trucks below office level 3', async () => {
  await showTown(withOfficeAt(2))

  const trucks = hireCard(namesHiresTruck())
  expect(within(trucks).queryByRole('button')).toBeNull()
  expect(within(trucks).getByText('Necesita la oficina en nivel 3')).toBeDefined()
})

const workersOrderedNow = (delivered: number): TownOverview => ({
  ...officeTown,
  hiring: {
    ...officeTown.hiring,
    order: {
      hire: 'worker',
      count: 3,
      delivered,
      secondsPerHire: 60,
      startedAt: instantAfter(0),
      endsAt: instantAfter(180),
    },
  },
})

it('shows each delivered hire after the next read', async () => {
  const reads = [workersOrderedNow(0), workersOrderedNow(1)]
  await showTown(officeTown, {
    town: async () => ({ ok: true, value: reads.shift() ?? workersOrderedNow(1) }),
  })
  expect(screen.getByText('0 de 3 contratados')).toBeDefined()

  await passSeconds(30)
  act(() => {
    window.dispatchEvent(new Event('focus'))
  })
  await passSeconds(0)

  expect(screen.getByText('1 de 3 contratados')).toBeDefined()
})

it('stops an order once on a double click', async () => {
  const stopped: Array<string> = []
  await showTown(hiringWorkers(1, 3), {
    stopHiringOrder: (target) => {
      stopped.push(`${target.hire}@${target.startedAt}`)
      return new Promise(() => undefined)
    },
  })

  const stop = screen.getByRole('button', { name: 'Parar la contratación de trabajadores' })
  act(() => {
    fireEvent.click(stop)
    fireEvent.click(stop)
  })
  await passSeconds(0)

  expect(stopped).toEqual([`worker@${instantAfter(-60)}`])
})

it('offers each kind with its cost, duration and the office level it needs', async () => {
  await showTown(withOfficeAt(3))

  const trucks = hireCard(namesHiresTruck())
  expect(within(trucks).getByRole('button', { name: 'Contratar 1 camión · 3:00' })).toBeDefined()
  expect(within(trucks).getByText('Necesita la oficina en nivel 3')).toBeDefined()
  expect(within(trucks).getByText('de material', { exact: false }).parentElement?.textContent).toBe(
    '60 de material',
  )
})

it('counts the hires the team holds per kind', async () => {
  await showTown({
    ...officeTown,
    hiring: { ...officeTown.hiring, hires: { worker: 4, truck: 1 } },
  })

  expect(within(hireCard(namesHiresWorker())).getByText('Tu equipo: 4 trabajadores')).toBeDefined()
  expect(within(hireCard(namesHiresTruck())).getByText('Tu equipo: 1 camión')).toBeDefined()
})

it('marks a hire the free people cannot staff with the people short', async () => {
  await showTown({ ...officeTown, people: { supplied: 97, free: 0, atWork: 97 } })

  const hire = within(hireCard(namesHiresWorker())).getByRole('button', { name: /^Contratar/ })
  expect(accessibleDescriptionOf(hire)).toBe('Gente necesaria: 1. Libres: 0.')
})

it('blocks a hire the stocks cannot pay and names the shortfall', async () => {
  await showTown({
    ...officeTown,
    stocks: {
      ...officeTown.stocks,
      money: { amount: 10, ratePerHour: 0, capacity: 5000, fullAt: null },
    },
  })

  const hire = within(hireCard(namesHiresWorker())).getByRole('button', { name: /^Contratar/ })
  expect(accessibleDescriptionOf(hire)).toBe('Necesitas 30 de dinero más.')
})

it('blocks a second hire while an order runs', async () => {
  await showTown(hiringWorkers(1, 3))

  const hire = within(hireCard(namesHiresWorker())).getByRole('button', { name: /^Contratar/ })
  expect(accessibleDescriptionOf(hire)).toBe('Espera a que termine esta contratación.')
})

it('reads a refused hire under its kind', async () => {
  await showTown(withOfficeAt(3), {
    placeHiringOrder: async () => ({
      ok: false,
      refusal: 'OfficeTooLow',
      error: {
        kind: 'OfficeTooLow',
        params: { hire: 'truck', requiredOfficeLevel: 3, officeLevel: 2 },
      },
    }),
  })

  fireEvent.click(within(hireCard(namesHiresTruck())).getByRole('button', { name: /^Contratar/ }))
  await passSeconds(0)

  expect(within(hireCard(namesHiresTruck())).getByRole('alert').textContent).toBe(
    'Tu oficina está en nivel 2 y esta contratación necesita el nivel 3.',
  )
})

it('names the hire in a hiring refusal', async () => {
  await showTown(officeTown, {
    placeHiringOrder: async () => ({
      ok: false,
      refusal: 'NotEnoughPeople',
      error: { kind: 'NotEnoughPeople', params: { requiredPeople: 3, freePeople: 1 } },
    }),
  })

  fireEvent.click(within(hireCard(namesHiresWorker())).getByRole('button', { name: /^Contratar/ }))
  await passSeconds(0)

  expect(within(hireCard(namesHiresWorker())).getByRole('alert').textContent).toBe(
    'Esta contratación necesita 3 personas libres y tienes 1. Sube el nivel de tus hogares.',
  )
})

it('names the hire when the stocks cannot pay a hiring', async () => {
  await showTown(officeTown, {
    placeHiringOrder: async () => ({
      ok: false,
      refusal: 'NotEnoughResources',
      error: {
        kind: 'NotEnoughResources',
        params: { missing: { money: 0, food: 0, power: 0, material: 40 } },
      },
    }),
  })

  fireEvent.click(within(hireCard(namesHiresWorker())).getByRole('button', { name: /^Contratar/ }))
  await passSeconds(0)

  expect(within(hireCard(namesHiresWorker())).getByRole('alert').textContent).toBe(
    'No tienes recursos suficientes para esta contratación. Espera a que crezcan tus reservas.',
  )
})

it('waits only on the kind being placed', async () => {
  await showTown(withOfficeAt(3), {
    placeHiringOrder: () => new Promise(() => undefined),
  })

  fireEvent.click(within(hireCard(namesHiresWorker())).getByRole('button', { name: /^Contratar/ }))
  await passSeconds(0)

  const workerHire = within(hireCard(namesHiresWorker())).getByRole('button', {
    name: /^Contratar/,
  })
  const truckHire = within(hireCard(namesHiresTruck())).getByRole('button', { name: /^Contratar/ })
  expect(workerHire.getAttribute('aria-busy')).toBe('true')
  expect(truckHire.getAttribute('aria-busy')).not.toBe('true')
})

const pressWorkerHireOf = async (town: TownOverview): Promise<ReadonlyArray<PlaceHiringOrder>> => {
  const placed: Array<PlaceHiringOrder> = []
  await showTown(town, {
    placeHiringOrder: async (order) => {
      placed.push(order)
      return { ok: true, value: town }
    },
  })
  fireEvent.click(within(hireCard(namesHiresWorker())).getByRole('button', { name: /^Contratar/ }))
  await passSeconds(0)
  return placed
}

it('sends a hire the stocks cannot pay, since the api decides', async () => {
  const placed = await pressWorkerHireOf({
    ...officeTown,
    stocks: {
      ...officeTown.stocks,
      money: { amount: 10, ratePerHour: 0, capacity: 5000, fullAt: null },
    },
  })

  expect(placed).toEqual([{ hire: 'worker', count: 1 }])
})

it('sends a hire the free people cannot staff, since the api decides', async () => {
  const placed = await pressWorkerHireOf({
    ...officeTown,
    people: { supplied: 97, free: 0, atWork: 97 },
  })

  expect(placed).toEqual([{ hire: 'worker', count: 1 }])
})

it('sends a second hire while an order runs, since the api decides', async () => {
  expect(await pressWorkerHireOf(hiringWorkers(1, 3))).toEqual([{ hire: 'worker', count: 1 }])
})

it('sends no hire for a count that is not a whole count', async () => {
  const placed: Array<PlaceHiringOrder> = []
  await showTown(officeTown, {
    placeHiringOrder: async (order) => {
      placed.push(order)
      return { ok: true, value: officeTown }
    },
  })
  const workers = hireCard(namesHiresWorker())
  fireEvent.change(within(workers).getByLabelText('Trabajadores a contratar'), {
    target: { value: '2.5' },
  })
  fireEvent.click(within(workers).getByRole('button', { name: /^Contratar/ }))
  await passSeconds(0)

  expect(placed).toEqual([])
})
