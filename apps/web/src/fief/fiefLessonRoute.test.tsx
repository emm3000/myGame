import {
  lessonCancelOf,
  lessonCancelRefund,
  lessonFree,
  lessonStart,
  lessonStudied,
  lessonTitle,
  lessonToReview,
  lessonUnderStudy,
  namesArtsSmithing,
  studySection,
  studyStudyRunning,
} from '@mygame/catalog'
import type { FiefOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { accessibleDescriptionOf } from '../design-system/accessibleDescriptionOf.testSupport'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownFief.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const lessonOne: FiefOverview['lessons'][number] = {
  id: 'lesson-1',
  theme: 'A day in town',
  durationSeconds: 150,
  requiredLibraryLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  isStudied: false,
  words: [1, 2, 3, 4, 5].map((n) => ({ wordId: `lesson-1-${n}`, isRetained: false })),
}

const libraryBuilt: FiefOverview = {
  ...knownFief,
  buildings: {
    ...knownFief.buildings,
    library: { ...knownFief.buildings.library, level: 1 },
  },
  lessons: [lessonOne],
}

const lessonUnderStudyFief: FiefOverview = {
  ...libraryBuilt,
  study: {
    kind: 'lesson',
    lessonId: 'lesson-1',
    startedAt: '2026-09-22T11:59:30.000Z',
    finishesAt: '2026-09-22T12:02:00.000Z',
  },
}

const lessonStudiedFief: FiefOverview = {
  ...libraryBuilt,
  lessons: [{ ...lessonOne, isStudied: true }],
}

const smithingUnderWay: FiefOverview = {
  ...libraryBuilt,
  study: {
    kind: 'busy',
    art: 'smithing',
    targetLevel: 1,
    startedAt: '2026-09-22T11:50:00.000Z',
    finishesAt: '2026-09-22T12:20:00.000Z',
    cost: { wood: 120, stone: 80, iron: 150, gold: 60, food: 0 },
  },
}

const showFief = async (overview: FiefOverview, overrides: Partial<ApiClient> = {}) => {
  renderAppAt(
    knownFiefPath,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: overview }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const librarySection = (): HTMLElement => screen.getByRole('region', { name: studySection() })

const lessonCard = (): HTMLElement =>
  within(librarySection()).getByRole('listitem', { name: lessonTitle() })

it('offers lesson 1 with its English theme beside the art cards', async () => {
  await showFief(libraryBuilt)

  expect(within(lessonCard()).getByText('A day in town').getAttribute('lang')).toBe('en')
  expect(within(lessonCard()).getByText(lessonFree({ wordCount: 5 }))).toBeTruthy()
})

it('starts lesson 1 by its id', async () => {
  const startLesson = vi.fn(async () => ({ ok: true as const, value: lessonUnderStudyFief }))
  await showFief(libraryBuilt, { startLesson })

  fireEvent.click(within(lessonCard()).getByRole('button', { name: lessonStart() }))
  await passSeconds(0)

  expect(startLesson).toHaveBeenCalledWith(knownFief.id, 'lesson-1')
})

it('keeps the lesson button in reach with the running study as its reason', async () => {
  await showFief(smithingUnderWay)

  const start = within(lessonCard()).getByRole('button', { name: lessonStart() })

  expect(start.getAttribute('aria-disabled')).toBe('true')
  expect(accessibleDescriptionOf(start)).toBe(studyStudyRunning())
})

it('reads the lesson under study with the time to its finish', async () => {
  await showFief(lessonUnderStudyFief)

  expect(within(lessonCard()).getByText(lessonUnderStudy())).toBeTruthy()
  expect(within(lessonCard()).getByText('2 min')).toBeTruthy()
  expect(within(lessonCard()).queryByRole('button')).toBeNull()
})

it('cancels the lesson from the study slot by its id', async () => {
  const cancelLesson = vi.fn(async () => ({ ok: true as const, value: libraryBuilt }))
  await showFief(lessonUnderStudyFief, { cancelLesson })

  fireEvent.click(within(librarySection()).getByRole('button', { name: lessonCancelOf() }))
  await passSeconds(0)

  expect(cancelLesson).toHaveBeenCalledWith(knownFief.id, 'lesson-1')
})

it('tells the player a cancelled lesson loses nothing', async () => {
  await showFief(lessonUnderStudyFief)

  expect(within(librarySection()).getByText(lessonCancelRefund())).toBeTruthy()
})

it('blocks the art cards while the lesson is under study', async () => {
  await showFief(lessonUnderStudyFief)

  const art = within(librarySection()).getByRole('listitem', { name: namesArtsSmithing() })

  expect(within(art).getByRole('button').getAttribute('aria-disabled')).toBe('true')
})

it('names the lesson in the strip while it is under study', async () => {
  await showFief(lessonUnderStudyFief)

  expect(screen.getByRole('link', { name: /lección 1/ })).toBeTruthy()
})

it('links a studied lesson to the review and offers no second study', async () => {
  await showFief(lessonStudiedFief)

  expect(within(lessonCard()).getByText(lessonStudied())).toBeTruthy()
  expect(
    within(lessonCard()).getByRole('link', { name: lessonToReview() }).getAttribute('href'),
  ).toBe(`${knownFiefPath}/repaso`)
  expect(within(lessonCard()).queryByRole('button')).toBeNull()
})
