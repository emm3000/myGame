import {
  namesPlacesFarm,
  namesPlacesHomes,
  reportNewsBuildingWorkFinished,
  shellRetainedWords,
  townLevel,
  townSkylineBuilt,
} from '@mygame/catalog'
import type { BuildingKind, TownOverview } from '@mygame/contracts/town'
import { act, screen, within } from '@testing-library/react'
import { afterEach, assert, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { skillRatesLineOf } from '../review/skillRatesLineOf'

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

const withLevels = (
  levels: Partial<Readonly<Record<BuildingKind, number>>>,
  overview: TownOverview = knownTown,
): TownOverview => ({
  ...overview,
  buildings: Object.fromEntries(
    Object.entries(overview.buildings).map(([place, state]) => [
      place,
      { ...state, level: levels[place as BuildingKind] ?? state.level },
    ]),
  ) as TownOverview['buildings'],
})

const withRetained = (count: number, overview: TownOverview = knownTown): TownOverview => ({
  ...overview,
  learning: { ...overview.learning, retainedWords: { count, total: 5 } },
})

const heldTown = withRetained(1, withLevels({ homes: 2, farm: 0 }))

const reread = (overview: TownOverview): TownOverview => ({ ...overview, readAt: instantAfter(60) })

const servingThen = (first: TownOverview, then: TownOverview): ApiClient =>
  stubApiClient({
    currentPlayer: async () => knownPlayer,
    town: async () => ({ ok: true, value: Date.now() < readAt + 60_000 ? first : then }),
  })

const showTown = async (apiClient: ApiClient, path = '/'): Promise<void> => {
  renderAppAt(path, apiClient)
  await passSeconds(0)
}

const skyline = (built: number): HTMLElement =>
  screen.getByRole('img', { name: townSkylineBuilt({ built, total: 7 }) })

const placeRow = (name: string): HTMLElement => screen.getByRole('listitem', { name })

const ring = (count: number): HTMLElement =>
  screen.getByRole('img', { name: shellRetainedWords({ count, total: 5 }) })

const playing = (scope: Element, row: string): ReadonlyArray<Element> => [
  ...scope.querySelectorAll(`[data-registers="${row}"]`),
]

const registeredRegion = (): Element => {
  const regions = [...document.querySelectorAll('body > div [aria-live="polite"]')].filter(
    (region) => region.closest('main') === null,
  )
  const region = regions.at(-1)
  assert(region !== undefined)
  return region
}

it("plays nothing on a page's first read", async () => {
  await showTown(servingThen(reread(withRetained(2, withLevels({ homes: 3, farm: 1 }))), heldTown))

  expect(document.querySelectorAll('[data-registers]')).toHaveLength(0)
  expect(registeredRegion().textContent).toBe('')
})

it('plays nothing when two reads agree', async () => {
  await showTown(servingThen(heldTown, reread(heldTown)))

  await passSeconds(60)

  expect(document.querySelectorAll('[data-registers]')).toHaveLength(0)
  expect(registeredRegion().textContent).toBe('')
})

it('pops the new window when a level finishes', async () => {
  await showTown(servingThen(heldTown, reread(withLevels({ homes: 3 }, heldTown))))

  await passSeconds(60)

  expect(playing(skyline(2), 'window')).toHaveLength(1)
  expect(playing(skyline(2), 'hue')).toHaveLength(0)
})

it('writes the new level on the place row', async () => {
  await showTown(servingThen(heldTown, reread(withLevels({ homes: 3 }, heldTown))))

  await passSeconds(60)

  const row = placeRow(namesPlacesHomes())
  expect(within(row).getByText(townLevel({ level: 3 }))).toBeDefined()
  expect(playing(row, 'window')).toHaveLength(1)
})

it('gives a place its hue when first built', async () => {
  await showTown(servingThen(heldTown, reread(withLevels({ farm: 1 }, heldTown))))

  await passSeconds(60)

  const row = placeRow(namesPlacesFarm())
  expect(playing(row, 'hue').length).toBeGreaterThan(0)
  expect(playing(skyline(3), 'hue').length).toBeGreaterThan(0)
})

it('moves the ring when a word is retained', async () => {
  await showTown(servingThen(heldTown, reread(withRetained(2, heldTown))))

  await passSeconds(60)

  expect(playing(ring(2), 'ring')).toHaveLength(1)
})

it('plays a row only on the read that brought it', async () => {
  await showTown(servingThen(heldTown, reread(withLevels({ homes: 3 }, heldTown))))
  await passSeconds(60)

  await passSeconds(60)

  expect(document.querySelectorAll('[data-registers]')).toHaveLength(0)
})

it('lands each row at once under reduced motion', async () => {
  await showTown(
    servingThen(heldTown, reread(withRetained(2, withLevels({ homes: 3, farm: 1 }, heldTown)))),
  )

  await passSeconds(60)

  const motionClasses = [...document.querySelectorAll('[data-registers]')].flatMap((element) =>
    (element.getAttribute('class') ?? '')
      .split(' ')
      .filter((name) => name.includes('transition-') || name.includes('starting:')),
  )
  expect(motionClasses.length).toBeGreaterThan(0)
  expect(motionClasses.filter((name) => !name.startsWith('motion-safe:'))).toEqual([])
})

it('speaks each row once', async () => {
  const skilled: TownOverview = {
    ...withRetained(2, withLevels({ homes: 3 }, heldTown)),
    stocks: { ...heldTown.stocks, food: { ...heldTown.stocks.food, ratePerHour: 126 } },
    skills: [
      { lessonId: 'lesson-1', resource: 'food', ratePercent: 5, earnedAt: instantAfter(30) },
    ],
  }
  await showTown(servingThen(heldTown, reread(skilled)))

  await passSeconds(60)
  const spoken = registeredRegion().firstElementChild
  expect(spoken?.textContent).toBe(
    [
      reportNewsBuildingWorkFinished({ place: namesPlacesHomes(), level: 3 }),
      shellRetainedWords({ count: 2, total: 5 }),
      skillRatesLineOf('food', 120, 126),
    ].join(' '),
  )

  await passSeconds(60)
  expect(registeredRegion().textContent).toBe('')
})

it('advances nothing between two reads', async () => {
  const working: TownOverview = {
    ...heldTown,
    work: {
      ...heldTown.work,
      slot: {
        building: 'homes',
        level: 3,
        cost: { money: 60, food: 40, power: 0, material: 80 },
        startsAt: instantAfter(-270),
        finishesAt: instantAfter(30),
      },
    },
  }
  await showTown(
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      town: () =>
        Date.now() < readAt + 1000
          ? Promise.resolve({ ok: true, value: working })
          : new Promise(() => undefined),
    }),
  )

  await passSeconds(45)

  expect(skyline(2)).toBeDefined()
  expect(document.querySelectorAll('[data-registers]')).toHaveLength(0)
})
