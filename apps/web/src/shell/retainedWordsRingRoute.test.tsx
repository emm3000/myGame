import { reviewAnswerField, reviewCheck, reviewCorrect, shellRetainedWords } from '@mygame/catalog'
import type { DueReview, ReviewAnswer, TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
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

type RetainedWords = TownOverview['learning']['retainedWords']

const townHolding = (retainedWords: RetainedWords): TownOverview => ({
  ...knownTown,
  learning: { ...knownTown.learning, retainedWords },
})

const signedInClient = (overrides: Partial<ApiClient>): ApiClient =>
  stubApiClient({ currentPlayer: async () => knownPlayer, ...overrides })

const showTownAt = async (path: string, retainedWords: RetainedWords): Promise<void> => {
  const town = townHolding(retainedWords)
  renderAppAt(path, signedInClient({ town: async () => ({ ok: true, value: town }) }))
  await passSeconds(0)
}

const header = (): HTMLElement => screen.getByRole('banner')

const ringOf = (count: number, total: number): HTMLElement =>
  screen.getByRole('img', { name: shellRetainedWords({ count, total }) })

const schoolRecall: DueReview = {
  wordId: 'lesson-1-2',
  lessonId: 'lesson-1',
  dueAt: knownTown.readAt,
  mode: 'recall',
  gloss: 'escuela',
  gappedFrame: [{ text: 'I walk to ____ every day.', support: null }],
}

const correctSchool: ReviewAnswer['verdict'] = {
  kind: 'correct',
  word: 'school',
  gloss: 'escuela',
  dueAt: knownTown.readAt,
  earnedSkill: null,
}

it('hides the ring while the count is null', async () => {
  await showTownAt('/', null)

  expect(within(header()).queryByRole('img')).toBeNull()
})

it('shows the retained words in the ring', async () => {
  await showTownAt('/', { count: 3, total: 5 })

  expect(ringOf(3, 5)).toBeTruthy()
})

it('shows the ring off the town home too', async () => {
  await showTownAt('/school', { count: 3, total: 5 })

  expect(ringOf(3, 5)).toBeTruthy()
})

it('says the count to a screen reader', async () => {
  await showTownAt('/', { count: 3, total: 5 })

  expect(within(header()).getByRole('img').getAttribute('aria-label')).toBe(
    '3 de 5 palabras aprendidas',
  )
})

it('says a total of one word in the singular', async () => {
  await showTownAt('/', { count: 1, total: 1 })

  expect(within(header()).getByRole('img').getAttribute('aria-label')).toBe(
    '1 de 1 palabra aprendida',
  )
})

it('moves the ring on no answer short of retained', async () => {
  const town = townHolding({ count: 2, total: 5 })
  renderAppAt(
    '/reviews',
    signedInClient({
      town: async () => ({ ok: true, value: town }),
      reviews: async () => ({
        ok: true,
        value: { due: [schoolRecall], readFirst: [], nextDueAt: null, readAt: knownTown.readAt },
      }),
      answerReview: async () => ({ ok: true, value: { verdict: correctSchool } }),
    }),
  )
  await passSeconds(0)

  fireEvent.change(screen.getByLabelText(reviewAnswerField()), { target: { value: 'school' } })
  fireEvent.click(screen.getByRole('button', { name: reviewCheck() }))
  await passSeconds(0)

  expect(screen.getByText(reviewCorrect())).toBeTruthy()
  expect(ringOf(2, 5)).toBeTruthy()
})
