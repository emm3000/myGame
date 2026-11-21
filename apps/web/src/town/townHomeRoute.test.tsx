import { es } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { palette } from '../design/tokens'
import {
  answeringOnDemand,
  holdSeconds,
  revealSeconds,
  skeletonBlocks,
} from '../design-system/loadingSkeleton.testSupport'
import { tabularFiguresOf } from '../design-system/tabularFiguresOf.testSupport'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import { isDrawnAlone } from './lineDrawnAlone.testSupport'

beforeEach(() => {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-ES')
})

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

const townHomeLink = (): HTMLElement | null =>
  screen.queryByRole('link', { name: es.townGoToSchool() })

it('keeps the loading line in a status region while the town loads', async () => {
  await showTown(serving(knownTown, { town: () => new Promise(() => undefined) }))

  expect(screen.getByRole('status').textContent).toBe(es.townLoading())
})

it('never draws the loading line on the screen', async () => {
  await showTown(serving(knownTown, { town: () => new Promise(() => undefined) }))

  expect(screen.getByRole('status').className.split(' ')).toContain('sr-only')
})

it('renders no skeleton when the town answers inside the reveal delay', async () => {
  const slow = answeringOnDemand(knownTown)
  await showTown(serving(knownTown, { town: slow.read }))
  await passSeconds(revealSeconds / 2)

  slow.answer()
  await passSeconds(0)

  expect(skeletonBlocks()).toEqual([])
  expect(townHomeLink()).not.toBeNull()
})

it('shows the skeleton when the town read is slow', async () => {
  await showTown(serving(knownTown, { town: () => new Promise(() => undefined) }))

  await passSeconds(revealSeconds)

  expect(skeletonBlocks().length).toBeGreaterThan(0)
  expect(townHomeLink()).toBeNull()
})

it('keeps the skeleton for the minimum hold when the town answers just after it appears', async () => {
  const slow = answeringOnDemand(knownTown)
  await showTown(serving(knownTown, { town: slow.read }))
  await passSeconds(revealSeconds)

  slow.answer()
  await passSeconds(holdSeconds / 2)

  expect(skeletonBlocks().length).toBeGreaterThan(0)
  expect(townHomeLink()).toBeNull()
})

it('draws the town once the minimum hold ends', async () => {
  const slow = answeringOnDemand(knownTown)
  await showTown(serving(knownTown, { town: slow.read }))
  await passSeconds(revealSeconds)
  slow.answer()

  await passSeconds(holdSeconds)

  expect(skeletonBlocks()).toEqual([])
  expect(townHomeLink()).not.toBeNull()
})

it('draws no skeleton on a refused read, only the retry', async () => {
  await showTown(
    serving(knownTown, { town: async () => ({ ok: false, refusal: 'InvalidCredentials' }) }),
  )

  await passSeconds(revealSeconds + holdSeconds)

  expect(skeletonBlocks()).toEqual([])
  expect(screen.getByRole('button', { name: es.townTryAgain() })).toBeDefined()
})

it('draws the held town with no loading state when coming back from the school', async () => {
  let reads = 0
  await showTown(
    serving(knownTown, {
      town: (): Promise<ApiOutcome<TownOverview>> => {
        reads += 1
        return reads === 1
          ? Promise.resolve({ ok: true, value: knownTown })
          : new Promise(() => undefined)
      },
    }),
  )

  fireEvent.click(screen.getByRole('link', { name: es.townGoToSchool() }))
  await passSeconds(0)
  expect(screen.getByRole('heading', { level: 1, name: es.namesPlacesSchool() })).toBeDefined()
  expect(screen.queryByRole('status')).toBeNull()

  fireEvent.click(screen.getByRole('link', { name: es.shellNavigationTown() }))
  await passSeconds(0)

  expect(townHomeLink()).not.toBeNull()
  expect(screen.queryByText(es.townLoading())).toBeNull()
  expect(skeletonBlocks()).toEqual([])
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
  expect(screen.getByText(refusalLineOf(es, 'InvalidCredentials'))).toBeDefined()
  expect(screen.queryByText(es.refusalUnexpected())).toBeNull()

  fireEvent.click(screen.getByRole('button', { name: es.townTryAgain() }))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 1, name: new RegExp(knownTown.name) })).toBeDefined()
})

const failedRead = async (): Promise<ApiOutcome<TownOverview>> => ({
  ok: false,
  refusal: 'Unexpected',
})

const signOutButton = (): HTMLElement => screen.getByRole('button', { name: es.shellSignOut() })

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

  expect(screen.getByRole('heading', { level: 1, name: es.authSignInTitle() })).toBeDefined()
  expect(isSignedIn).toBe(false)
})

it('draws the failed read sign-out as a text button', async () => {
  await showTown(serving(knownTown, { town: failedRead }))

  expect(signOutButton().dataset.tone).toBe('text')
})

it('keeps sign-out off the live town home', async () => {
  await showTown(serving(knownTown))

  expect(screen.queryByRole('button', { name: es.shellSignOut() })).toBeNull()
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

const foodFullAt = (
  fullAt: string | null,
  amount = knownTown.stocks.food.amount,
): TownOverview => ({
  ...knownTown,
  stocks: { ...knownTown.stocks, food: { ...knownTown.stocks.food, amount, fullAt } },
})

it('reads the fill hour within 8 h', async () => {
  await showTown(serving(foodFullAt('2026-11-10T14:30:00.000Z')))

  const food = within(stockCell('Comida'))
  expect(food.getByText(es.townFullAt({ clock: '15:30' }))).toBeDefined()
  expect(food.queryByText('+120 / h')).toBeNull()
})

it('reads the fill hour at exactly 8 h', async () => {
  await showTown(serving(foodFullAt('2026-11-10T17:00:00.000Z')))

  const food = within(stockCell('Comida'))
  expect(food.getByText(es.townFullAt({ clock: '18:00' }))).toBeDefined()
  expect(food.queryByText('+120 / h')).toBeNull()
})

it('reads the rate past 8 h', async () => {
  await showTown(serving(foodFullAt('2026-11-10T17:00:01.000Z')))

  const food = within(stockCell('Comida'))
  expect(food.getByText('+120 / h')).toBeDefined()
  expect(food.queryByText(es.townFullAt({ clock: '18:00' }))).toBeNull()
})

it('reads the rate while the store has no fill instant', async () => {
  await showTown(serving(foodFullAt(null)))

  expect(within(stockCell('Comida')).getByText('+120 / h')).toBeDefined()
})

it('reads full for a full store', async () => {
  await showTown(serving(foodFullAt(knownTown.readAt, knownTown.stocks.food.capacity)))

  const food = within(stockCell('Comida'))
  expect(food.getByText(es.townFull({ capacity: '5 000' }))).toBeDefined()
  expect(food.queryByText(es.townFullAt({ clock: '10:00' }))).toBeNull()
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

  const foodSkill = es.schoolSkillName({ resource: townResourceNameOf(es, 'food'), level: 2 })
  expect(within(stockCell('Comida')).getByText(foodSkill)).toBeDefined()
  const money = within(stockCell('Dinero'))
  const moneySkill = es.schoolSkillName({ resource: townResourceNameOf(es, 'money'), level: 1 })
  expect([money.queryByText(foodSkill), money.queryByText(moneySkill)]).toEqual([null, null])
})

it('shows no skill beside a resource while none is earned', async () => {
  await showTown(serving(knownTown))

  const shownLevels = [0, 1].filter(
    (level) =>
      within(stockCell('Comida')).queryByText(
        es.schoolSkillName({ resource: townResourceNameOf(es, 'food'), level }),
      ) !== null,
  )
  expect(shownLevels).toEqual([])
})

it('projects each stock between reads up to storage', async () => {
  const nearlyFull: TownOverview = {
    ...knownTown,
    stocks: {
      ...knownTown.stocks,
      food: { amount: 1000, ratePerHour: 3600, capacity: 5000, fullAt: null },
      power: { amount: 4990, ratePerHour: 3600, capacity: 5000, fullAt: null },
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
  const builtLevels = [
    es.namesPlacesHomes(),
    es.namesPlacesFarm(),
    es.namesPlacesPowerStation(),
  ].map(windowsOf)
  const places = screen.getByRole('region', { name: es.townPlacesTitleTown() })
  expect(within(places).getAllByRole('heading', { level: 4 })).toHaveLength(7)
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

  const stocks = within(screen.getByRole('list', { name: es.townStocks() }))
    .getAllByRole('listitem')
    .map((stock) => stock.getAttribute('aria-label'))

  expect(stocks).toEqual(['Dinero', 'Comida', 'Energía', 'Material'])
})

it('says how many places are built on the skyline', async () => {
  await showTown(serving(knownTown))

  expect(
    screen.getByRole('img', { name: es.townSkylineBuilt({ built: 2, total: 7 }) }),
  ).toBeDefined()
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

  expect(row(es.namesPlacesOffice()).getByText(es.townNotBuilt())).toBeDefined()
  expect(row(es.namesPlacesFarm()).getByText(es.townInWork())).toBeDefined()
  expect(
    row(es.namesPlacesHomes()).getByText(
      isDrawnAlone(`${es.townLevel({ level: 1 })} · ${es.townInWork()}`, 'es'),
    ),
  ).toBeDefined()
  expect(
    row(es.namesPlacesSchool()).getByText(isDrawnAlone(es.townLevel({ level: 1 }), 'es')),
  ).toBeDefined()
})

const farmAtLevelThree: TownOverview['buildings']['farm'] = {
  level: 3,
  nextLevel: {
    level: 4,
    cost: { money: 60, food: 0, power: 0, material: 0 },
    people: 2,
    durationSeconds: 60,
    wordsNeeded: null,
  },
}

const workOnFarmLevelFour: TownOverview['work'] = {
  slot: {
    building: 'farm',
    level: 4,
    cost: { money: 60, food: 0, power: 0, material: 0 },
    startsAt: '2026-11-10T08:59:00.000Z',
    finishesAt: '2026-11-10T09:04:00.000Z',
  },
  waitingList: [],
  cap: 2,
}

const placeLevelLine = (place: string, line: string): HTMLElement =>
  within(screen.getByRole('listitem', { name: place })).getByText(isDrawnAlone(line, 'es'))

it('draws the level of an idle place as the whole text of its own tabular element', async () => {
  await showTown(
    serving({ ...knownTown, buildings: { ...knownTown.buildings, farm: farmAtLevelThree } }),
  )

  const levelLine = placeLevelLine(es.namesPlacesFarm(), es.townLevel({ level: 3 }))
  expect(tabularFiguresOf(levelLine)).toEqual(['3'])
  expect(levelLine.closest('p')?.classList.contains('tabular-nums')).toBe(false)
})

it('draws the level of a place in work as the whole text of its own tabular element', async () => {
  await showTown(
    serving({
      ...knownTown,
      buildings: { ...knownTown.buildings, farm: farmAtLevelThree },
      work: workOnFarmLevelFour,
    }),
  )

  const levelLine = placeLevelLine(
    es.namesPlacesFarm(),
    `${es.townLevel({ level: 3 })} · ${es.townInWork()}`,
  )
  expect(tabularFiguresOf(levelLine)).toEqual(['3'])
  expect(levelLine.closest('p')?.classList.contains('tabular-nums')).toBe(false)
})

it('draws no tabular figure on the level line of a place not built', async () => {
  await showTown(serving({ ...knownTown, work: workOnFarm }))

  expect(tabularFiguresOf(placeLevelLine(es.namesPlacesOffice(), es.townNotBuilt()))).toEqual([])
  expect(tabularFiguresOf(placeLevelLine(es.namesPlacesFarm(), es.townInWork()))).toEqual([])
})

const farmToBuild: TownOverview['buildings']['farm'] = {
  level: 0,
  nextLevel: {
    level: 1,
    cost: { money: 900, food: 0, power: 0, material: 0 },
    people: 2,
    durationSeconds: 60,
    wordsNeeded: null,
  },
}

it('says a shortfall in words', async () => {
  await showTown(
    serving({ ...knownTown, buildings: { ...knownTown.buildings, farm: farmToBuild } }),
  )

  const farm = within(screen.getByRole('listitem', { name: es.namesPlacesFarm() }))

  expect(
    farm.getByRole('button', {
      name: new RegExp(es.townBuild({ level: 1 })),
      description: (description) =>
        description.startsWith(
          es.townShortfall({
            missing: es.townAmount({ amount: '400', resource: es.namesTownResourcesMoney() }),
          }),
        ),
    }),
  ).toBeDefined()
})

it('names the minute the resources arrive under a card short only of them', async () => {
  await showTown(
    serving({ ...knownTown, buildings: { ...knownTown.buildings, farm: farmToBuild } }),
  )

  const farm = within(screen.getByRole('listitem', { name: es.namesPlacesFarm() }))

  expect(
    farm.getByRole('button', {
      name: new RegExp(es.townBuild({ level: 1 })),
      description: `${es.townShortfall({
        missing: es.townAmount({ amount: '400', resource: es.namesTownResourcesMoney() }),
      })} ${es.townReadyAt({ time: '16:40' })}`,
    }),
  ).toBeDefined()
})

it("keeps a cost's name for a screen reader", async () => {
  await showTown(
    serving({ ...knownTown, buildings: { ...knownTown.buildings, farm: farmToBuild } }),
  )

  const costs = within(screen.getByRole('listitem', { name: es.namesPlacesFarm() })).getByRole(
    'list',
  )

  expect(within(costs).getByRole('listitem').textContent).toContain(
    es.townCostName({ resource: es.namesTownResourcesMoney() }),
  )
})

const farmNeeding = (
  wordsNeeded: NonNullable<TownOverview['buildings']['farm']['nextLevel']>['wordsNeeded'],
): TownOverview['buildings']['farm'] => ({
  level: 2,
  nextLevel: {
    level: 3,
    cost: { money: 60, food: 0, power: 0, material: 0 },
    people: 2,
    durationSeconds: 60,
    wordsNeeded,
  },
})

const townWithWords = (farm: TownOverview['buildings']['farm']): TownOverview => ({
  ...knownTown,
  buildings: { ...knownTown.buildings, farm },
  stableWordCount: 7,
  retainedWordCount: 3,
})

const farmRow = (): ReturnType<typeof within> =>
  within(screen.getByRole('listitem', { name: es.namesPlacesFarm() }))

it('draws a stable need with its count', async () => {
  await showTown(serving(townWithWords(farmNeeding({ count: 10, standing: 'stable' }))))

  expect(
    farmRow().getByText(
      isDrawnAlone(es.townWordsNeeded({ standing: 'stable', needed: 10, held: 7 }), 'es'),
    ),
  ).toBeDefined()
})

it('draws a retained need with its count', async () => {
  await showTown(serving(townWithWords(farmNeeding({ count: 5, standing: 'retained' }))))

  expect(
    farmRow().getByText(
      isDrawnAlone(es.townWordsNeeded({ standing: 'retained', needed: 5, held: 3 }), 'es'),
    ),
  ).toBeDefined()
})

const stableNeedLine = (): HTMLElement =>
  farmRow().getByText(
    isDrawnAlone(es.townWordsNeeded({ standing: 'stable', needed: 10, held: 7 }), 'es'),
  )

const peopleAtWorkLine = (): HTMLElement =>
  farmRow().getByText(isDrawnAlone(es.townPeopleAtWork({ people: 2 }), 'es'))

it('draws each number of a word need as the whole text of its own tabular element', async () => {
  await showTown(serving(townWithWords(farmNeeding({ count: 10, standing: 'stable' }))))

  expect(tabularFiguresOf(stableNeedLine())).toEqual(['10', '7', '10'])
})

it('draws the people a place puts to work as the whole text of its own tabular element', async () => {
  await showTown(serving(townWithWords(farmNeeding({ count: 10, standing: 'stable' }))))

  expect(tabularFiguresOf(peopleAtWorkLine())).toEqual(['2'])
})

it('keeps tabular figures off the paragraphs of a place card', async () => {
  await showTown(serving(townWithWords(farmNeeding({ count: 10, standing: 'stable' }))))

  expect(
    [stableNeedLine(), peopleAtWorkLine()].map((line) =>
      line.closest('p')?.classList.contains('tabular-nums'),
    ),
  ).toEqual([false, false])
})

it('draws no need below level 3', async () => {
  await showTown(serving(townWithWords(farmNeeding(null))))

  const needWord =
    es.townWordsNeeded({ standing: 'stable', needed: 10, held: 7 }).split(' ')[0] ?? ''
  expect(needWord).not.toBe('')
  expect(farmRow().queryByText(needWord, { exact: false })).toBeNull()
})

it("draws the town's reviewed and learned words", async () => {
  await showTown(serving(townWithWords(farmNeeding(null))))

  const stocks = within(screen.getByRole('region', { name: es.townStocks() }))

  expect(stocks.getByText(es.townWordsReviewed({ count: 7 }))).toBeDefined()
  expect(stocks.getByText(es.townWordsLearned({ count: 3 }))).toBeDefined()
})

it("draws the town's reviewed and learned words at zero", async () => {
  await showTown(serving({ ...knownTown, stableWordCount: 0, retainedWordCount: 0 }))

  const stocks = within(screen.getByRole('region', { name: es.townStocks() }))

  expect(stocks.getByText(es.townWordsReviewed({ count: 0 }))).toBeDefined()
  expect(stocks.getByText(es.townWordsLearned({ count: 0 }))).toBeDefined()
})

it('writes the season under the stocks', async () => {
  await showTown(
    serving({
      ...knownTown,
      season: {
        kind: 'fall',
        year: 2,
        endsAt: '2026-11-13T09:00:00.000Z',
        productionPercent: { money: 100, food: 100, power: 100, material: 100 },
        durationPercent: { build: 100, study: 100, hire: 100, road: 75 },
      },
    }),
  )

  const stocks = within(screen.getByRole('region', { name: es.townStocks() }))

  expect(stocks.getByText(es.townSeasonLine({ season: 'Otoño', year: 2 }))).toBeDefined()
  expect(
    stocks.getByText(
      es.townSeasonEndsIn({ season: 'Otoño', timeLeft: es.townSeasonDays({ days: 3 }) }),
    ),
  ).toBeDefined()
})

it('labels the town a city once the server does', async () => {
  await showTown(serving({ ...knownTown, label: 'city' }))

  const heading = screen.getByRole('heading', { level: 1 })
  expect(heading.textContent).toContain(es.townLabelCity())
  expect(heading.textContent).not.toContain(es.townLabelTown())
})

it('titles the places of a city as the city', async () => {
  await showTown(serving({ ...knownTown, label: 'city' }))

  expect(screen.getByRole('heading', { level: 3, name: es.townPlacesTitleCity() })).toBeDefined()
})

it('reads the town again when its season ends', async () => {
  let reads = 0
  const endingSeason: TownOverview = {
    ...knownTown,
    season: {
      kind: 'fall',
      year: 1,
      endsAt: '2026-11-10T09:00:30.000Z',
      productionPercent: { money: 100, food: 100, power: 100, material: 100 },
      durationPercent: { build: 100, study: 100, hire: 100, road: 75 },
    },
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

it('opens the map from its row on the town home', async () => {
  await showTown(serving(knownTown))

  fireEvent.click(screen.getByRole('link', { name: es.mapRowLink() }))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 1, name: es.mapTitle() })).toBeDefined()
  expect(screen.getByRole('heading', { level: 2, name: 'Zona 1' })).toBeDefined()
})
