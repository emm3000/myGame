import { reviewCheck, reviewDueCount, reviewNext } from '@mygame/catalog'
import type { DueReview, ReviewAnswer, Reviews } from '@mygame/contracts'
import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { formatQuantity } from '../design-system/formatQuantity'
import { skillRatesLineOf } from './skillRatesLineOf'

const readAt = knownTown.readAt

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const recognitionOf = (word: string, gloss: string): DueReview => ({
  wordId: `word-${word}`,
  lessonId: 'lesson-1',
  dueAt: readAt,
  mode: 'recognition',
  word,
  frame: [{ text: `We have a ${word} in this town.`, support: null }],
  choices: [
    { choiceId: `choice-${word}`, gloss },
    { choiceId: 'choice-other', gloss: 'dinero' },
  ],
})

const home = recognitionOf('home', 'hogar')
const school = recognitionOf('school', 'escuela')
const farm = recognitionOf('farm', 'granja')

const dueOf = (...due: ReadonlyArray<DueReview>): Reviews => ({
  due: [...due],
  readFirst: [],
  nextDueAt: null,
  readAt,
})

const correctHome: ReviewAnswer['verdict'] = {
  kind: 'correct',
  word: 'home',
  gloss: 'hogar',
  dueAt: readAt,
  earnedSkill: null,
}

const wrongHome: ReviewAnswer['verdict'] = {
  kind: 'wrong',
  word: 'home',
  gloss: 'hogar',
  dueAt: readAt,
}

const showReview = async (
  before: Reviews,
  after: Reviews,
  verdict: ReviewAnswer['verdict'],
): Promise<void> => {
  let isAnswered = false
  const apiClient: ApiClient = stubApiClient({
    currentPlayer: async () => knownPlayer,
    town: async () => ({ ok: true, value: knownTown }),
    reviews: async () => ({ ok: true, value: isAnswered ? after : before }),
    answerReview: async () => {
      isAnswered = true
      return { ok: true, value: { verdict } }
    },
  })
  renderAppAt('/reviews', apiClient)
  await passSeconds(0)
}

const answerHome = async (): Promise<void> => {
  fireEvent.click(screen.getByRole('radio', { name: 'hogar' }))
  fireEvent.click(screen.getByRole('button', { name: reviewCheck() }))
  await passSeconds(0)
}

const pressNext = async (): Promise<void> => {
  fireEvent.click(screen.getByRole('button', { name: reviewNext() }))
  await passSeconds(0)
}

const dealt = (): ReadonlyArray<Element> => [
  ...document.querySelectorAll('main [data-registers="deal"]'),
]

const stackHues = (): ReadonlyArray<string | undefined> =>
  [...document.querySelectorAll<HTMLElement>('main [data-stacked-hue]')].map(
    (block) => block.dataset.stackedHue,
  )

const reviewLiveRegion = (): Element | null => document.querySelector('main [aria-live="polite"]')

it('deals the next card on a right answer', async () => {
  await showReview(dueOf(home, school), dueOf(school), correctHome)

  await answerHome()
  await pressNext()

  expect(dealt()).toHaveLength(1)
  expect(dealt()[0]?.contains(screen.getByRole('region', { name: 'school' }))).toBe(true)
})

it('changes the card in place after a wrong answer', async () => {
  await showReview(dueOf(home, school), dueOf(school, home), wrongHome)

  await answerHome()
  await pressNext()

  expect(screen.getByRole('region', { name: 'school' })).toBeDefined()
  expect(dealt()).toHaveLength(0)
})

it('deals nothing on the first card', async () => {
  await showReview(dueOf(home, school), dueOf(school), correctHome)

  expect(dealt()).toHaveLength(0)
})

it('stacks the next hues behind the card', async () => {
  await showReview(dueOf(home, school, farm), dueOf(school, farm), correctHome)

  expect(stackHues()).toEqual(['periwinkle', 'mint'])
})

it('stacks no more cards than are due after this one', async () => {
  await showReview(dueOf(home, school), dueOf(school), correctHome)

  await answerHome()
  await pressNext()

  expect(stackHues()).toEqual([])
})

it('speaks the due count when it deals the next card', async () => {
  await showReview(dueOf(home, school), dueOf(school), correctHome)

  await answerHome()
  expect(reviewLiveRegion()?.textContent).toBe('')
  await pressNext()

  expect(reviewLiveRegion()?.textContent).toBe(reviewDueCount({ count: formatQuantity(1) }))
})

const correctHomeEarningFood: ReviewAnswer['verdict'] = {
  ...correctHome,
  earnedSkill: {
    lessonId: 'lesson-1',
    resource: 'food',
    ratePercent: 5,
    earnedAt: readAt,
    level: 1,
    ratePerHourBefore: 120,
    ratePerHourAfter: 126,
    words: ['home', 'school'],
  },
}

const motionClassesOf = (row: string): ReadonlyArray<string> =>
  [...document.querySelectorAll(`main [data-registers="${row}"]`)].flatMap((element) =>
    element.className
      .split(' ')
      .filter((name) => name.includes('transition-') || name.includes('starting:')),
  )

it('changes the rate with the skill verdict', async () => {
  await showReview(dueOf(home, school), dueOf(school), correctHomeEarningFood)

  await answerHome()

  const rate = screen.getByText(skillRatesLineOf('food', 120, 126))
  expect(rate.dataset.registers).toBe('rate')
})

it('lands the card and the rate at once under reduced motion', async () => {
  await showReview(dueOf(home, school), dueOf(school), correctHomeEarningFood)

  await answerHome()
  const rateClasses = motionClassesOf('rate')
  await pressNext()
  const motionClasses = [...rateClasses, ...motionClassesOf('deal')]

  expect([rateClasses.length > 0, motionClasses.length > rateClasses.length]).toEqual([true, true])
  expect(motionClasses.filter((name) => !name.startsWith('motion-safe:'))).toEqual([])
})
