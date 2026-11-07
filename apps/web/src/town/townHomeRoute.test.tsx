import {
  authSignInTitle,
  namesPlacesFarm,
  namesPlacesHomes,
  namesPlacesOffice,
  namesPlacesPowerStation,
  namesPlacesSchool,
  namesTownResourcesMoney,
  refusalUnexpected,
  schoolSkillName,
  shellSignOut,
  townAmount,
  townBuild,
  townCostName,
  townInWork,
  townLabelCity,
  townLabelTown,
  townLevel,
  townLoading,
  townNotBuilt,
  townPlacesTitleCity,
  townSeasonDays,
  townSeasonEndsIn,
  townSeasonLine,
  townShortfall,
  townSkylineBuilt,
  townStocks,
  townTryAgain,
} from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts/town'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { palette } from '../design/tokens'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { townResourceNameOf } from '../resources/townResourceNameOf'

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
        return reads === 1
          ? { ok: false, refusal: 'InvalidCredentials' }
          : { ok: true, value: knownTown }
      },
    }),
  )
  expect(screen.getByText(refusalLineOf('InvalidCredentials'))).toBeDefined()
  expect(screen.queryByText(refusalUnexpected())).toBeNull()

  fireEvent.click(screen.getByRole('button', { name: townTryAgain() }))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 1, name: new RegExp(knownTown.name) })).toBeDefined()
})

const failedRead = async (): Promise<ApiOutcome<TownOverview>> => ({
  ok: false,
  refusal: 'Unexpected',
})

const signOutButton = (): HTMLElement => screen.getByRole('button', { name: shellSignOut() })

it('signs out from a failed town read', async () => {
  let isSignedIn = true
  await showTown(
    serving(knownTown, {
      currentPlayer: async () => (isSignedIn ? knownPlayer : undefined),
      signOut: async () => {
        isSignedIn = false
        return { ok: true, value: undefined }
      },
      town: failedRead,
    }),
  )

  fireEvent.click(signOutButton())
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 1, name: authSignInTitle() })).toBeDefined()
  expect(isSignedIn).toBe(false)
})

it('draws the failed read sign-out as a text button', async () => {
  await showTown(serving(knownTown, { town: failedRead }))

  expect(signOutButton().dataset.tone).toBe('text')
})

it('keeps sign-out off the live town home', async () => {
  await showTown(serving(knownTown))

  expect(screen.queryByRole('button', { name: shellSignOut() })).toBeNull()
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

const earnedSkill = (
  lessonId: string,
  resource: TownOverview['skills'][number]['resource'],
): TownOverview['skills'][number] => ({
  lessonId,
  resource,
  ratePercent: 5,
  earnedAt: knownTown.readAt,
})

it('shows the earned skill beside its resource', async () => {
  const skills = [earnedSkill('lesson-1', 'food'), earnedSkill('lesson-3', 'food')]
  await showTown(serving({ ...knownTown, skills }))

  const foodSkill = schoolSkillName({ resource: townResourceNameOf('food'), level: 2 })
  expect(within(stockCell('Comida')).getByText(foodSkill)).toBeDefined()
  const money = within(stockCell('Dinero'))
  const moneySkill = schoolSkillName({ resource: townResourceNameOf('money'), level: 1 })
  expect([money.queryByText(foodSkill), money.queryByText(moneySkill)]).toEqual([null, null])
})

it('shows no skill beside a resource while none is earned', async () => {
  await showTown(serving(knownTown))

  const shownLevels = [0, 1].filter(
    (level) =>
      within(stockCell('Comida')).queryByText(
        schoolSkillName({ resource: townResourceNameOf('food'), level }),
      ) !== null,
  )
  expect(shownLevels).toEqual([])
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

it('draws each place with one window per level, a place not built with none', async () => {
  const grown: TownOverview = {
    ...knownTown,
    buildings: { ...knownTown.buildings, homes: { level: 4, nextLevel: null } },
  }
  await showTown(serving(grown))

  const windowsOf = (place: string): number =>
    screen
      .getByRole('listitem', { name: place })
      .querySelectorAll(`svg [fill="${palette['on-block'].light}"]`).length
  const builtLevels = [namesPlacesHomes(), namesPlacesFarm(), namesPlacesPowerStation()].map(
    windowsOf,
  )
  expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(7)
  expect(builtLevels).toEqual([4, 0, 0])
})

it('holds one top heading on the town home, with the name of the town', async () => {
  await showTown(serving(knownTown))

  const [heading, ...others] = screen.getAllByRole('heading', { level: 1 })

  expect(heading?.textContent).toContain(knownTown.name)
  expect(others).toEqual([])
})

it('orders the stocks money, food, power, material', async () => {
  await showTown(serving(knownTown))

  const stocks = within(screen.getByRole('list', { name: townStocks() }))
    .getAllByRole('listitem')
    .map((stock) => stock.getAttribute('aria-label'))

  expect(stocks).toEqual(['Dinero', 'Comida', 'Energía', 'Material'])
})

it('says how many places are built on the skyline', async () => {
  await showTown(serving(knownTown))

  expect(screen.getByRole('img', { name: townSkylineBuilt({ built: 2, total: 7 }) })).toBeDefined()
})

const workOnFarm: TownOverview['work'] = {
  slot: {
    building: 'farm',
    level: 1,
    cost: { money: 60, food: 40, power: 0, material: 80 },
    startsAt: '2026-11-10T08:59:00.000Z',
    finishesAt: '2026-11-10T09:04:00.000Z',
  },
  waitingList: [
    {
      building: 'homes',
      level: 2,
      cost: { money: 60, food: 40, power: 0, material: 80 },
      startsAt: '2026-11-10T09:04:00.000Z',
      finishesAt: '2026-11-10T09:09:00.000Z',
    },
  ],
  cap: 2,
}

it('writes the level beside every place', async () => {
  await showTown(serving({ ...knownTown, work: workOnFarm }))

  const row = (place: string): ReturnType<typeof within> =>
    within(screen.getByRole('listitem', { name: place }))

  expect(row(namesPlacesOffice()).getByText(townNotBuilt())).toBeDefined()
  expect(row(namesPlacesFarm()).getByText(townInWork())).toBeDefined()
  expect(
    row(namesPlacesHomes()).getByText(`${townLevel({ level: 1 })} · ${townInWork()}`),
  ).toBeDefined()
  expect(row(namesPlacesSchool()).getByText(townLevel({ level: 1 }))).toBeDefined()
})

const farmToBuild: TownOverview['buildings']['farm'] = {
  level: 0,
  nextLevel: {
    level: 1,
    cost: { money: 900, food: 0, power: 0, material: 0 },
    people: 2,
    durationSeconds: 60,
  },
}

it('says a shortfall in words', async () => {
  await showTown(
    serving({ ...knownTown, buildings: { ...knownTown.buildings, farm: farmToBuild } }),
  )

  const farm = within(screen.getByRole('listitem', { name: namesPlacesFarm() }))

  expect(
    farm.getByRole('button', {
      name: new RegExp(townBuild({ level: 1 })),
      description: townShortfall({
        missing: townAmount({ amount: '400', resource: namesTownResourcesMoney() }),
      }),
    }),
  ).toBeDefined()
})

it("keeps a cost's name for a screen reader", async () => {
  await showTown(
    serving({ ...knownTown, buildings: { ...knownTown.buildings, farm: farmToBuild } }),
  )

  const costs = within(screen.getByRole('listitem', { name: namesPlacesFarm() })).getByRole('list')

  expect(within(costs).getByRole('listitem').textContent).toContain(
    townCostName({ resource: namesTownResourcesMoney() }),
  )
})

it('writes the season under the stocks', async () => {
  await showTown(
    serving({
      ...knownTown,
      season: { kind: 'fall', year: 2, endsAt: '2026-11-13T09:00:00.000Z' },
    }),
  )

  const stocks = within(screen.getByRole('region', { name: townStocks() }))

  expect(stocks.getByText(townSeasonLine({ season: 'Otoño', year: 2 }))).toBeDefined()
  expect(
    stocks.getByText(townSeasonEndsIn({ season: 'Otoño', timeLeft: townSeasonDays({ days: 3 }) })),
  ).toBeDefined()
})

it('labels the town a city once the server does', async () => {
  await showTown(serving({ ...knownTown, label: 'city' }))

  const heading = screen.getByRole('heading', { level: 1 })
  expect(heading.textContent).toContain(townLabelCity())
  expect(heading.textContent).not.toContain(townLabelTown())
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

  await passSeconds(29)
  expect(reads).toBe(1)

  await passSeconds(1)

  expect(reads).toBe(2)
})
