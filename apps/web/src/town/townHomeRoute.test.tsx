import {
  namesPlacesFarm,
  namesPlacesHomes,
  namesPlacesPowerStation,
  refusalUnexpected,
  townLabelCity,
  townLabelTown,
  townLoading,
  townPlacesTitleCity,
  townTryAgain,
} from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts/town'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownTown.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const serving = (town: TownOverview, overrides: Partial<ApiClient> = {}): ApiClient =>
  stubApiClient({
    currentPlayer: async () => knownPlayer,
    town: async () => ({ ok: true, value: town }),
    ...overrides,
  })

const showTown = async (apiClient: ApiClient): Promise<void> => {
  renderAppAt('/', apiClient)
  await passSeconds(0)
}

const stockCell = (name: string): HTMLElement => screen.getByRole('listitem', { name })

it('shows the reading line while the town loads', async () => {
  await showTown(serving(knownTown, { town: () => new Promise(() => undefined) }))

  expect(screen.getByRole('status').textContent).toBe(townLoading())
})

it('offers to read the town again after a failed read', async () => {
  let reads = 0
  await showTown(
    serving(knownTown, {
      town: async (): Promise<ApiOutcome<TownOverview>> => {
        reads += 1
        return reads === 1 ? { ok: false, refusal: 'Unexpected' } : { ok: true, value: knownTown }
      },
    }),
  )
  expect(screen.getByText(refusalUnexpected())).toBeDefined()

  fireEvent.click(screen.getByRole('button', { name: townTryAgain() }))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 2, name: knownTown.name })).toBeDefined()
})

it('shows each stock with its rate and its storage', async () => {
  await showTown(serving(knownTown))

  const food = stockCell('Comida')
  expect(within(food).getByText('400')).toBeDefined()
  expect(within(food).getByText('de 5 000')).toBeDefined()
  expect(within(food).getByText('+120 / h')).toBeDefined()
  expect(stockCell('Dinero')).toBeDefined()
  expect(stockCell('Energía')).toBeDefined()
  expect(stockCell('Material')).toBeDefined()
})

it('projects each stock between reads up to storage', async () => {
  const nearlyFull: TownOverview = {
    ...knownTown,
    stocks: {
      ...knownTown.stocks,
      food: { amount: 1000, ratePerHour: 3600, capacity: 5000 },
      power: { amount: 4990, ratePerHour: 3600, capacity: 5000 },
    },
  }
  await showTown(
    serving(nearlyFull, {
      town: vi
        .fn<ApiClient['town']>()
        .mockResolvedValueOnce({ ok: true, value: nearlyFull })
        .mockReturnValue(new Promise(() => undefined)),
    }),
  )

  await passSeconds(60)

  expect(within(stockCell('Comida')).getByText('1 060')).toBeDefined()
  expect(within(stockCell('Energía')).getByText('5 000')).toBeDefined()
  expect(within(stockCell('Energía')).getByText('Lleno: 5 000')).toBeDefined()
})

it('shows the people free and at work', async () => {
  await showTown(serving(knownTown))

  expect(screen.getByText('Gente: 24 libres, 96 trabajando')).toBeDefined()
})

it('draws each place with the image of its tier', async () => {
  const grown: TownOverview = {
    ...knownTown,
    buildings: { ...knownTown.buildings, homes: { level: 4, nextLevel: null } },
  }
  await showTown(serving(grown))

  const imageOf = (place: string): HTMLImageElement | null =>
    screen.getByRole('listitem', { name: place }).querySelector('img')
  expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(7)
  expect(imageOf(namesPlacesHomes())?.getAttribute('src')).toBe('/art/places/homes-2.svg')
  expect(imageOf(namesPlacesFarm())).toBeNull()
  expect(imageOf(namesPlacesPowerStation())).toBeNull()
})

it('labels the town a city once the server does', async () => {
  await showTown(serving({ ...knownTown, label: 'city' }))

  const main = within(screen.getByRole('main'))
  expect(main.getByText(townLabelCity())).toBeDefined()
  expect(main.queryByText(townLabelTown())).toBeNull()
})

it('titles the places of a city as the city', async () => {
  await showTown(serving({ ...knownTown, label: 'city' }))

  expect(screen.getByRole('heading', { level: 3, name: townPlacesTitleCity() })).toBeDefined()
})

it('reads the town again when its season ends', async () => {
  let reads = 0
  const endingSeason: TownOverview = {
    ...knownTown,
    season: { kind: 'fall', year: 1, endsAt: '2026-11-10T09:00:30.000Z' },
  }
  await showTown(
    serving(endingSeason, {
      town: async () => {
        reads += 1
        return { ok: true, value: endingSeason }
      },
    }),
  )

  await passSeconds(30)

  expect(reads).toBe(2)
})
