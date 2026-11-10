import {
  reviewAnswerField,
  reviewBackToTown,
  reviewCheck,
  reviewCorrect,
  reviewLessonReady,
  reviewNext,
  reviewSkillRate,
  reviewSkillRates,
  reviewSkillWords,
  schoolLessonReadWords,
  schoolLessonTitle,
  schoolPathCount,
  schoolPathStudied,
} from '@mygame/catalog'
import type { DueReview, Reviews, ReviewVerdict, TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import { inkPills } from '../school/inkPills.testSupport'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownTown.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

type Lesson = TownOverview['lessons'][number]

const lessonOf = (number: number, overrides: Partial<Lesson> = {}): Lesson => ({
  id: `lesson-${number}`,
  theme: `Theme ${number}`,
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  isStudied: true,
  words: Array.from({ length: 5 }, (_, index) => ({
    wordId: `lesson-${number}-${index + 1}`,
    standing: 'recognize',
    reading: null,
  })),
  ...overrides,
})

const townWith = (overrides: Partial<TownOverview>): TownOverview => ({
  ...knownTown,
  lessons: [lessonOf(1), lessonOf(2)],
  ...overrides,
})

const recallOf = (lessonId: string, word: string): DueReview => ({
  wordId: `${lessonId}-${word}`,
  lessonId,
  dueAt: knownTown.readAt,
  mode: 'recall',
  gloss: `gloss of ${word}`,
  gappedFrame: 'I walk to ____ every day.',
})

const reviewsOf = (
  due: ReadonlyArray<DueReview>,
  readFirst: ReadonlyArray<string>,
  nextDueAt: string | null = null,
): Reviews => ({ due: [...due], readFirst: [...readFirst], nextDueAt, readAt: knownTown.readAt })

const correctSchool: ReviewVerdict = {
  kind: 'correct',
  word: 'school',
  gloss: 'escuela',
  dueAt: '2026-11-12T09:00:00.000Z',
  earnedSkill: null,
}

const readingInTurn = (...answers: ReadonlyArray<Reviews>): ApiClient['reviews'] => {
  const reviews = vi.fn<ApiClient['reviews']>()
  for (const answer of answers) {
    reviews.mockResolvedValueOnce({ ok: true, value: answer })
  }
  const last = answers.at(-1)
  return last === undefined ? reviews : reviews.mockResolvedValue({ ok: true, value: last })
}

const showReviews = async (
  reviews: ApiClient['reviews'],
  overrides: Partial<ApiClient> = {},
): Promise<void> => {
  renderAppAt(
    '/reviews',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      town: async () => ({ ok: true, value: townWith({}) }),
      reviews,
      answerReview: async () => ({ ok: true, value: { verdict: correctSchool } }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const answerAndGoOn = async (): Promise<void> => {
  fireEvent.change(screen.getByLabelText(reviewAnswerField()), { target: { value: 'school' } })
  fireEvent.click(screen.getByRole('button', { name: reviewCheck() }))
  await passSeconds(0)
  fireEvent.click(screen.getByRole('button', { name: reviewNext() }))
  await passSeconds(0)
}

it('sends the player to the words when a lesson finishes during the reviews', async () => {
  await showReviews(
    readingInTurn(
      reviewsOf([recallOf('lesson-1', 'school')], []),
      reviewsOf([recallOf('lesson-2', 'farm')], ['lesson-2']),
    ),
  )

  await answerAndGoOn()

  expect(screen.getByRole('heading', { name: reviewLessonReady({ number: 2 }) })).toBeTruthy()
  expect(screen.getByRole('link', { name: schoolLessonReadWords() }).getAttribute('href')).toBe(
    '/school/lesson-2',
  )
  expect(screen.queryByLabelText(reviewAnswerField())).toBeNull()
})

it('never sends back a player who walked the words', async () => {
  await showReviews(readingInTurn(reviewsOf([recallOf('lesson-2', 'farm')], ['lesson-2'])))

  expect(screen.getByLabelText(reviewAnswerField())).toBeTruthy()
  expect(screen.queryByRole('link', { name: schoolLessonReadWords() })).toBeNull()
})

it('reviews the earlier cards before it stops at the finished lesson', async () => {
  await showReviews(
    readingInTurn(
      reviewsOf([recallOf('lesson-1', 'school'), recallOf('lesson-1', 'home')], []),
      reviewsOf([recallOf('lesson-1', 'home'), recallOf('lesson-2', 'farm')], ['lesson-2']),
    ),
  )

  await answerAndGoOn()

  expect(screen.getByLabelText(reviewAnswerField())).toBeTruthy()
  expect(screen.getByText('gloss of home')).toBeTruthy()
})

it('stops at the finished lesson with no line while the town is unread', async () => {
  await showReviews(
    readingInTurn(
      reviewsOf([recallOf('lesson-1', 'school')], []),
      reviewsOf([recallOf('lesson-2', 'farm')], ['lesson-2']),
    ),
    { town: async () => ({ ok: false, refusal: 'Unexpected' }) },
  )

  await answerAndGoOn()

  expect(inkPills()).toEqual([schoolLessonReadWords()])
  expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
})

it("offers a way back at the review's end", async () => {
  await showReviews(readingInTurn(reviewsOf([], [], '2026-11-10T10:00:00.000Z')))

  expect(inkPills()).toEqual([reviewBackToTown()])
  expect(screen.getByRole('link', { name: reviewBackToTown() }).getAttribute('href')).toBe('/')
})

it('offers a way back when the player holds no cards', async () => {
  await showReviews(readingInTurn(reviewsOf([], [])))

  expect(inkPills()).toEqual([reviewBackToTown()])
})

const laterReview = '2026-11-10T10:00:00.000Z'

const earnedFood = {
  lessonId: 'lesson-1',
  resource: 'food' as const,
  ratePercent: 5,
  earnedAt: knownTown.readAt,
}

const retainedLessonOne = lessonOf(1, {
  words: lessonOf(1).words.map((word) => ({ ...word, standing: 'retained' as const })),
})

const pathSection = (number: number): HTMLElement =>
  screen.getByRole('region', { name: schoolLessonTitle({ number }) })

it("shows the school path at the review's end", async () => {
  const town = townWith({ lessons: [retainedLessonOne, lessonOf(2)], skills: [earnedFood] })
  await showReviews(readingInTurn(reviewsOf([], [], laterReview)), {
    town: async () => ({ ok: true, value: town }),
  })

  const path = within(pathSection(2))
  expect(path.getByText(schoolPathStudied())).toBeTruthy()
  expect(path.getAllByText(schoolPathCount({ count: 5, total: 5 }))).toHaveLength(1)
})

it('shows no school path once every studied lesson earned its skill', async () => {
  const notStarted = lessonOf(2, {
    isStudied: false,
    words: lessonOf(2).words.map((word) => ({ ...word, standing: 'notStarted' as const })),
  })
  const town = townWith({ lessons: [retainedLessonOne, notStarted], skills: [earnedFood] })
  await showReviews(readingInTurn(reviewsOf([], [], laterReview)), {
    town: async () => ({ ok: true, value: town }),
  })

  expect(screen.queryByRole('region', { name: schoolLessonTitle({ number: 2 }) })).toBeNull()
})

it('shows no school path to a player with no town', async () => {
  await showReviews(readingInTurn(reviewsOf([], [], laterReview)), {
    town: async () => ({ ok: false, refusal: 'TownNotFound' }),
  })

  expect(screen.queryByText(schoolPathStudied())).toBeNull()
  expect(inkPills()).toEqual([reviewBackToTown()])
})

const earningVerdict = (
  ratePerHourBefore: number | null,
  ratePerHourAfter: number | null,
): ReviewVerdict => ({
  ...correctSchool,
  earnedSkill: {
    ...earnedFood,
    level: 1,
    ratePerHourBefore,
    ratePerHourAfter,
    words: ['home', 'school', 'work'],
  },
})

const answerEarning = async (verdict: ReviewVerdict): Promise<HTMLElement> => {
  await showReviews(readingInTurn(reviewsOf([recallOf('lesson-1', 'school')], [])), {
    answerReview: async () => ({ ok: true, value: { verdict } }),
  })
  fireEvent.change(screen.getByLabelText(reviewAnswerField()), { target: { value: 'school' } })
  fireEvent.click(screen.getByRole('button', { name: reviewCheck() }))
  await passSeconds(0)
  return screen.getByRole('region', { name: reviewCorrect() })
}

it("shows the rates and the lesson's words on the skill verdict", async () => {
  const verdict = within(await answerEarning(earningVerdict(120.5, 126.75)))

  expect(
    verdict.getByText(reviewSkillRates({ resource: 'Comida', before: '120', after: '126' })),
  ).toBeTruthy()
  const words = verdict.getByText('home, school, work')
  expect([words.getAttribute('lang'), words.parentElement?.textContent]).toEqual([
    'en',
    `${reviewSkillWords()} home, school, work`,
  ])
})

it('keeps the percent line with no town', async () => {
  const verdict = within(await answerEarning(earningVerdict(null, null)))

  expect(
    verdict.getByText(reviewSkillRate({ percent: 5, resource: townResourceNameOf('food') })),
  ).toBeTruthy()
  expect(verdict.queryByText(/\/ h,/)).toBeNull()
})
