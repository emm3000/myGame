import {
  refusalReviewNotDue,
  reviewAnswerField,
  reviewAskHint,
  reviewCheck,
  reviewChecking,
  reviewComesBack,
  reviewCorrect,
  reviewDueCount,
  reviewFailed,
  reviewHint,
  reviewLoading,
  reviewNearMiss,
  reviewNext,
  reviewNoCards,
  reviewNothingDue,
  reviewRetry,
  reviewSkillEarned,
  reviewSkillRate,
  reviewTitle,
  reviewWrong,
} from '@mygame/catalog'
import type { DueReview, FiefOverview, ReviewAnswer, Reviews } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownFief, knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'
import { townResourceNameOf } from '../resources/townResourceNameOf'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownFief.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const reviewPath = '/reviews'

const homeRecognition: DueReview = {
  wordId: 'lesson-1-1',
  lessonId: 'lesson-1',
  dueAt: '2026-09-22T11:58:00.000Z',
  mode: 'recognition',
  word: 'home',
  frame: 'We have a new home in this town.',
  choices: [
    { choiceId: 'choice-a', gloss: 'escuela' },
    { choiceId: 'choice-b', gloss: 'hogar' },
    { choiceId: 'choice-c', gloss: 'dinero' },
  ],
}

const schoolRecall: DueReview = {
  wordId: 'lesson-1-2',
  lessonId: 'lesson-1',
  dueAt: '2026-09-22T11:59:00.000Z',
  mode: 'recall',
  gloss: 'escuela',
  gappedFrame: 'I walk to ____ every day.',
}

const withReviews = (
  due: ReadonlyArray<DueReview>,
  nextDueAt: string | null,
  readAt = knownFief.readAt,
): Reviews => ({
  due: [...due],
  nextDueAt,
  readAt,
})

const recallDue = withReviews([schoolRecall], null)
const nothingDue = withReviews([], '2026-09-22T12:09:00.000Z')
const noCards = withReviews([], null)

const readingReviews = (...answers: ReadonlyArray<Reviews>) => {
  const reviews = vi.fn<ApiClient['reviews']>()
  for (const answer of answers) {
    reviews.mockResolvedValueOnce({ ok: true, value: answer })
  }
  const last = answers.at(-1) ?? noCards
  return reviews.mockResolvedValue({ ok: true, value: last })
}

const showReview = async (
  shown: Reviews | ApiClient['reviews'],
  overrides: Partial<ApiClient> = {},
): Promise<void> => {
  renderAppAt(
    reviewPath,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      reviews: typeof shown === 'function' ? shown : readingReviews(shown),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const answering = (verdict: ReviewAnswer['verdict']) =>
  vi.fn(async () => ({ ok: true as const, value: { verdict } }))

const reviewRegion = (): HTMLElement => screen.getByRole('region', { name: reviewTitle() })

const answerField = (): HTMLElement => screen.getByLabelText(reviewAnswerField())

const typeAndCheck = async (answer: string): Promise<void> => {
  fireEvent.change(answerField(), { target: { value: answer } })
  fireEvent.click(screen.getByRole('button', { name: reviewCheck() }))
  await passSeconds(0)
}

it('reads the review while the reviews are on their way', async () => {
  await showReview(() => new Promise<ApiOutcome<Reviews>>(() => undefined))

  expect(screen.getByText(reviewLoading())).toBeTruthy()
})

it('offers to read the reviews again after a failed read', async () => {
  const reviews = vi
    .fn<ApiClient['reviews']>()
    .mockResolvedValueOnce({ ok: false, refusal: 'Unexpected' })
    .mockResolvedValue({ ok: true, value: recallDue })
  await showReview(reviews)

  expect(screen.getByText(reviewFailed())).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: reviewRetry() }))
  await passSeconds(0)

  expect(screen.getByText('escuela')).toBeTruthy()
})

it("reads the due reviews from the player's reviews", async () => {
  await showReview(recallDue, {
    fief: () => new Promise<ApiOutcome<FiefOverview>>(() => undefined),
  })

  expect(screen.getByText('escuela')).toBeTruthy()
  expect(screen.getByText(reviewDueCount({ count: 1 }))).toBeTruthy()
})

it('tells a player with no cards there is nothing to review yet', async () => {
  await showReview(noCards)

  expect(screen.getByText(reviewNoCards())).toBeTruthy()
})

it('offers no practice when nothing is due and names the next review', async () => {
  await showReview(nothingDue)

  expect(screen.getByText(reviewNothingDue())).toBeTruthy()
  expect(screen.getByText('9 min')).toBeTruthy()
  expect(within(reviewRegion()).queryByRole('button')).toBeNull()
})

const readFiveMinutesAhead = withReviews([], '2026-09-22T12:09:00.000Z', '2026-09-22T12:05:00.000Z')
const fiefNeverRead = (): Promise<ApiOutcome<FiefOverview>> => new Promise(() => undefined)

it('names the next review from the instant the server read the reviews at', async () => {
  await showReview(readFiveMinutesAhead, { fief: fiefNeverRead })

  expect(screen.getByText('4 min')).toBeTruthy()
})

it("paces the next review on the server's read instant", async () => {
  const reviews = readingReviews(readFiveMinutesAhead, recallDue)
  await showReview(reviews, { fief: fiefNeverRead })

  await passSeconds(4 * 60)

  expect(screen.getByText('escuela')).toBeTruthy()
})

it('draws only the cards the api answers as due, the first one first', async () => {
  await showReview(withReviews([homeRecognition, schoolRecall], null))

  expect(screen.getByText(reviewDueCount({ count: 2 }))).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'home' })).toBeTruthy()
  expect(screen.queryByText('I walk to ____ every day.')).toBeNull()
})

it('marks the English item and its es glosses with their languages', async () => {
  await showReview(withReviews([homeRecognition], null))

  expect(screen.getByRole('heading', { name: 'home' }).getAttribute('lang')).toBe('en')
  expect(screen.getByText('We have a new home in this town.').getAttribute('lang')).toBe('en')
  expect(screen.getByText('hogar').getAttribute('lang')).toBe('es')
})

it('sends the chosen meaning by its choice id', async () => {
  const answerReview = answering({
    kind: 'correct',
    word: 'home',
    gloss: 'hogar',
    dueAt: knownFief.readAt,
    earnedSkill: null,
  })
  await showReview(withReviews([homeRecognition], null), { answerReview })

  fireEvent.click(screen.getByRole('radio', { name: 'hogar' }))
  fireEvent.click(screen.getByRole('button', { name: reviewCheck() }))
  await passSeconds(0)

  expect(answerReview).toHaveBeenCalledWith({ wordId: 'lesson-1-1', answer: 'choice-b' })
})

it('asks the gloss of a recall card in a labelled English field', async () => {
  await showReview(recallDue)

  expect(screen.getByText('escuela').getAttribute('lang')).toBe('es')
  expect(screen.getByText('I walk to ____ every day.').getAttribute('lang')).toBe('en')
  expect(answerField().getAttribute('lang')).toBe('en')
})

it('sends the answer exactly as typed, spaces and case kept', async () => {
  const answerReview = answering({ kind: 'nearMiss' })
  await showReview(recallDue, { answerReview })

  await typeAndCheck(' Scool ')

  expect(answerReview).toHaveBeenCalledWith({ wordId: 'lesson-1-2', answer: ' Scool ' })
})

it('reads the check as under way while the answer is on its way', async () => {
  const answerReview = vi.fn(() => new Promise<ApiOutcome<ReviewAnswer>>(() => undefined))
  await showReview(recallDue, { answerReview })

  await typeAndCheck('school')

  expect(screen.getByRole('button', { name: reviewChecking() }).getAttribute('aria-busy')).toBe(
    'true',
  )
})

it('keeps the typed field after a near-miss', async () => {
  await showReview(recallDue, { answerReview: answering({ kind: 'nearMiss' }) })

  await typeAndCheck('scool')

  expect(screen.getByText(reviewNearMiss())).toBeTruthy()
  expect(screen.getByDisplayValue('scool')).toBe(answerField())
  expect(screen.getByRole('button', { name: reviewCheck() })).toBeTruthy()
})

it('shows the hint the api answers', async () => {
  const hintRequest = vi.fn(async () => ({
    ok: true as const,
    value: { firstLetter: 's', letterCount: 6 },
  }))
  await showReview(recallDue, { reviewHint: hintRequest })

  fireEvent.click(screen.getByRole('button', { name: reviewAskHint() }))
  await passSeconds(0)

  expect(hintRequest).toHaveBeenCalledWith('lesson-1-2')
  expect(screen.getByText(reviewHint({ firstLetter: 's', letterCount: 6 }))).toBeTruthy()
})

it('shows the correct form beside the answer after a wrong answer', async () => {
  const answerReview = answering({
    kind: 'wrong',
    word: 'school',
    gloss: 'escuela',
    dueAt: knownFief.readAt,
  })
  await showReview(recallDue, { answerReview })

  await typeAndCheck('house')

  expect(screen.getByText(reviewWrong())).toBeTruthy()
  expect(screen.getByText('house').getAttribute('lang')).toBe('en')
  expect(screen.getByText('school').getAttribute('lang')).toBe('en')
  expect(screen.getByText(reviewComesBack())).toBeTruthy()
})

it('shows the gloss chosen beside the right one after a wrong recognition', async () => {
  const answerReview = answering({
    kind: 'wrong',
    word: 'home',
    gloss: 'hogar',
    dueAt: knownFief.readAt,
  })
  await showReview(withReviews([homeRecognition], null), { answerReview })

  fireEvent.click(screen.getByRole('radio', { name: 'dinero' }))
  fireEvent.click(screen.getByRole('button', { name: reviewCheck() }))
  await passSeconds(0)

  const verdict = screen.getByRole('region', { name: reviewWrong() })
  expect(within(verdict).getByText('dinero').getAttribute('lang')).toBe('es')
  expect(within(verdict).getByText('hogar').getAttribute('lang')).toBe('es')
})

const correctSchool: ReviewAnswer['verdict'] = {
  kind: 'correct',
  word: 'school',
  gloss: 'escuela',
  dueAt: knownFief.readAt,
  earnedSkill: null,
}

it('re-reads the reviews after an answer', async () => {
  const reviews = readingReviews(recallDue, nothingDue)
  await showReview(reviews, { answerReview: answering(correctSchool) })

  await typeAndCheck('school')

  expect(reviews).toHaveBeenCalledTimes(2)
})

it('moves to the next due card after a correct answer', async () => {
  const reviews = readingReviews(
    withReviews([schoolRecall, homeRecognition], null),
    withReviews([homeRecognition], null),
  )
  await showReview(reviews, { answerReview: answering(correctSchool) })

  await typeAndCheck('school')
  expect(screen.getByText(reviewCorrect())).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: reviewNext() }))
  await passSeconds(0)

  expect(screen.getByRole('heading', { name: 'home' })).toBeTruthy()
})

const foodSkill = {
  lessonId: 'lesson-1',
  resource: 'food' as const,
  ratePercent: 5,
  earnedAt: knownFief.readAt,
}

it('names the skill a correct answer earns at the level the api answers', async () => {
  const answerReview = answering({
    ...correctSchool,
    earnedSkill: { ...foodSkill, level: 2, ratePerHourBefore: 120, ratePerHourAfter: 126 },
  })
  await showReview(recallDue, { answerReview })

  await typeAndCheck('school')

  expect(
    screen.getByText(reviewSkillEarned({ resource: townResourceNameOf('food'), level: 2 })),
  ).toBeTruthy()
  expect(
    screen.getByText(reviewSkillRate({ percent: 5, resource: townResourceNameOf('food') })),
  ).toBeTruthy()
})

it('shows an earned skill without rates while the player holds no town', async () => {
  const answerReview = answering({
    ...correctSchool,
    earnedSkill: { ...foodSkill, level: 1, ratePerHourBefore: null, ratePerHourAfter: null },
  })
  await showReview(recallDue, { answerReview })

  await typeAndCheck('school')

  expect(
    screen.getByText(reviewSkillEarned({ resource: townResourceNameOf('food'), level: 1 })),
  ).toBeTruthy()
  expect(
    screen.getByText(reviewSkillRate({ percent: 5, resource: townResourceNameOf('food') })),
  ).toBeTruthy()
})

it('caps the typed answer at the 100 characters the api accepts', async () => {
  await showReview(recallDue)

  expect(answerField().getAttribute('maxLength')).toBe('100')
})

it('blocks the check of a recall card while the field is empty', async () => {
  const answerReview = answering({ kind: 'nearMiss' })
  await showReview(recallDue, { answerReview })

  const check = screen.getByRole('button', { name: reviewCheck() })
  fireEvent.click(check)
  await passSeconds(0)

  expect(check.getAttribute('aria-disabled')).toBe('true')
  expect(answerReview).not.toHaveBeenCalled()
})

it('sends nothing when enter is pressed in the empty recall field', async () => {
  const answerReview = answering({ kind: 'nearMiss' })
  await showReview(recallDue, { answerReview })

  const field = answerField()
  fireEvent.keyDown(field, { key: 'Enter' })
  fireEvent.submit(field)
  await passSeconds(0)

  expect(answerReview).not.toHaveBeenCalled()
})

it('keeps the due count of the card on screen until the next card', async () => {
  const reviews = readingReviews(recallDue, nothingDue)
  await showReview(reviews, { answerReview: answering(correctSchool) })

  await typeAndCheck('school')

  expect(screen.getByText(reviewCorrect())).toBeTruthy()
  expect(screen.getByText(reviewDueCount({ count: 1 }))).toBeTruthy()
})

it('shows a refused answer by its kind', async () => {
  const answerReview = vi.fn(async () => ({ ok: false as const, refusal: 'ReviewNotDue' as const }))
  await showReview(recallDue, { answerReview })

  await typeAndCheck('school')

  expect(screen.getByText(refusalReviewNotDue())).toBeTruthy()
})
