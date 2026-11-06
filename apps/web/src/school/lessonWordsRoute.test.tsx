import {
  namesPlacesSchool,
  reportStartReviews,
  reviewTitle,
  schoolLessonNext,
  schoolLessonNothingToRead,
  schoolLessonTitle,
  schoolLessonWordNext,
  schoolLessonWordPosition,
  schoolLessonWordThen,
  townGoToSchool,
  townLoading,
  townTryAgain,
} from '@mygame/catalog'
import type { Report, TownOverview } from '@mygame/contracts/town'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'

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

type Lesson = TownOverview['lessons'][number]
type LessonWord = Lesson['words'][number]

const readableWord = (word: string): LessonWord => ({
  wordId: `id-${word}`,
  standing: 'recognize',
  reading: { word, gloss: `gloss of ${word}`, frame: `A frame of ${word}.` },
})

const reviewedWord = (word: string): LessonWord => ({
  wordId: `id-${word}`,
  standing: 'recall',
  reading: null,
})

const lessonOf = (number: number, words: ReadonlyArray<LessonWord>): Lesson => ({
  id: `lesson-${number}`,
  theme: `Theme ${number}`,
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  isStudied: words.length > 0,
  words: [...words],
})

const unreadLessonOf = (number: number): Lesson =>
  lessonOf(number, [readableWord(`first${number}`), readableWord(`second${number}`)])

const running = (lessonId: string): TownOverview['lessonSlot'] => ({
  lessonId,
  startedAt: instantAfter(-60),
  finishesAt: instantAfter(240),
})

const townOf = (overrides: Partial<TownOverview>): TownOverview => ({
  ...knownTown,
  lessons: [unreadLessonOf(1)],
  ...overrides,
})

const reportOf = (readFirst: ReadonlyArray<string>): Report => ({
  dueCount: readFirst.length,
  due: [],
  readFirst: [...readFirst],
  nextDueAt: null,
  news: [],
})

const showLesson = async (
  path: string,
  town: TownOverview,
  overrides: Partial<ApiClient> = {},
): Promise<void> => {
  renderAppAt(
    path,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      town: async () => ({ ok: true, value: town }),
      report: async () => ({ ok: true, value: reportOf([]) }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const wordHeading = (word: string): HTMLElement =>
  screen.getByRole('heading', { level: 3, name: word })

const nextWord = (): HTMLElement => screen.getByRole('button', { name: schoolLessonWordNext() })

const startReviews = (): HTMLElement =>
  within(screen.getByRole('main')).getByRole('link', { name: reportStartReviews() })

const nextLesson = (): HTMLElement => screen.getByRole('link', { name: schoolLessonNext() })

const lessonHeading = (number: number): HTMLElement =>
  screen.getByRole('heading', { level: 2, name: schoolLessonTitle({ number }) })

const follow = async (link: HTMLElement): Promise<void> => {
  fireEvent.click(link)
  await passSeconds(0)
}

const lessonsFinished = (numbers: ReadonlyArray<number>): TownOverview =>
  townOf({ lessons: numbers.map(unreadLessonOf) })

it('shows one word at a time with its gloss and frame', async () => {
  await showLesson('/school/lesson-1', townOf({ lessonSlot: running('lesson-1') }))

  expect(wordHeading('first1').getAttribute('lang')).toBe('en')
  expect(screen.getByText('gloss of first1')).toBeDefined()
  expect(screen.getByText('A frame of first1.').getAttribute('lang')).toBe('en')
  expect(screen.getByText(schoolLessonWordPosition({ number: 1, count: 2 }))).toBeDefined()
  expect(screen.queryByText('second1')).toBeNull()

  await follow(nextWord())

  expect(wordHeading('second1')).toBeDefined()
  expect(screen.getByText('gloss of second1')).toBeDefined()
  expect(screen.queryByText('first1')).toBeNull()
})

it("draws the place's silhouette where the word names one", async () => {
  const town = townOf({
    lessons: [lessonOf(1, [readableWord('school'), readableWord('money')])],
    lessonSlot: running('lesson-1'),
  })
  await showLesson('/school/lesson-1', town)
  const silhouetteOnCard = (): Element | null =>
    screen.getByRole('article').querySelector('svg [fill="var(--on-block)"]')

  expect(silhouetteOnCard()).not.toBeNull()

  await follow(nextWord())

  expect(silhouetteOnCard()).toBeNull()
})

it("sets the silhouette on the word's block, since on-block vanishes on the card", async () => {
  const town = townOf({
    lessons: [lessonOf(1, [readableWord('school')])],
    lessonSlot: running('lesson-1'),
  })
  await showLesson('/school/lesson-1', town)

  expect(
    screen.getByRole('article').querySelector('.bg-block-peach svg [fill="var(--on-block)"]'),
  ).not.toBeNull()
})

it('shows a running lesson with its time', async () => {
  await showLesson('/school/lesson-1', townOf({ lessonSlot: running('lesson-1') }))

  expect(lessonHeading(1)).toBeDefined()
  expect(within(screen.getByRole('main')).getByRole('timer').textContent).toBe('4 min')
})

it('moves the focus to the next word', async () => {
  await showLesson('/school/lesson-1', townOf({}))

  fireEvent.click(nextWord())
  await passSeconds(0)

  expect(document.activeElement).toBe(wordHeading('second1'))
})

it('stays on the last word when a fresh read shortens the lesson', async () => {
  const words = ['first', 'second', 'third'].map(readableWord)
  const studying = townOf({ lessons: [lessonOf(1, words)], lessonSlot: running('lesson-1') })
  const shortened = townOf({ lessons: [lessonOf(1, words.slice(0, 2))] })
  await showLesson('/school/lesson-1', studying, {
    town: async () => ({
      ok: true,
      value: Date.now() < readAt + 240_000 ? studying : { ...shortened, readAt: instantAfter(240) },
    }),
  })
  fireEvent.click(nextWord())
  await passSeconds(0)
  fireEvent.click(nextWord())
  await passSeconds(0)

  await passSeconds(240)

  expect(wordHeading('second')).toBeDefined()
  expect(screen.getByText(schoolLessonWordPosition({ number: 2, count: 2 }))).toBeDefined()
})

it('offers the way on only once the lesson has finished', async () => {
  const town = townOf({ lessonSlot: running('lesson-1') })
  await showLesson('/school/lesson-1', town)

  expect(screen.queryByRole('link', { name: reportStartReviews() })).toBeNull()
  await follow(nextWord())
  expect(screen.queryByRole('link', { name: reportStartReviews() })).toBeNull()
  expect(screen.getByText(schoolLessonWordThen())).toBeDefined()
  expect(screen.getByRole('link', { name: townGoToSchool() }).getAttribute('href')).toBe('/school')
})

it('offers the way on from every word of a finished lesson', async () => {
  await showLesson('/school/lesson-1', townOf({}))

  expect(startReviews().getAttribute('href')).toBe('/reviews')
  await follow(nextWord())
  expect(startReviews().getAttribute('href')).toBe('/reviews')
  expect(within(screen.getByRole('main')).queryByRole('timer')).toBeNull()
})

it('offers the way on from a finished lesson while another lesson runs', async () => {
  const town = townOf({
    lessons: [unreadLessonOf(1), unreadLessonOf(2)],
    lessonSlot: running('lesson-2'),
  })
  await showLesson('/school/lesson-1', town)

  expect(startReviews().getAttribute('href')).toBe('/reviews')
  expect(within(screen.getByRole('main')).queryByRole('timer')).toBeNull()
})

it('offers the way on when a running lesson finishes on the screen', async () => {
  const studying = townOf({ lessonSlot: running('lesson-1') })
  const finished = townOf({})
  await showLesson('/school/lesson-1', studying, {
    town: async () => ({
      ok: true,
      value: Date.now() < readAt + 240_000 ? studying : { ...finished, readAt: instantAfter(240) },
    }),
  })

  await passSeconds(240)

  expect(startReviews().getAttribute('href')).toBe('/reviews')
})

it('keeps the word on screen when the lesson finishes', async () => {
  const studying = townOf({ lessonSlot: running('lesson-1') })
  await showLesson('/school/lesson-1', studying, {
    town: async () => ({
      ok: true,
      value: Date.now() < readAt + 240_000 ? studying : townOf({ readAt: instantAfter(240) }),
    }),
  })
  fireEvent.click(nextWord())

  await passSeconds(240)

  expect(wordHeading('second1')).toBeDefined()
})

it("reads the Report again at the lesson's finish", async () => {
  const studying = townOf({ lessonSlot: running('lesson-1') })
  const finished = townOf({ lessons: [unreadLessonOf(1), unreadLessonOf(2)] })
  await showLesson('/school/lesson-1', studying, {
    town: async () => ({
      ok: true,
      value: Date.now() < readAt + 240_000 ? studying : { ...finished, readAt: instantAfter(240) },
    }),
    report: async () => ({
      ok: true,
      value: reportOf(Date.now() < readAt + 240_000 ? [] : ['lesson-1', 'lesson-2']),
    }),
  })

  await passSeconds(240)

  expect(nextLesson().getAttribute('href')).toBe('/school/lesson-2')
})

it('shows the rest of a lesson with some words already reviewed', async () => {
  const town = townOf({
    lessons: [lessonOf(1, [reviewedWord('first1'), readableWord('second1')])],
  })
  await showLesson('/school/lesson-1', town)

  expect(wordHeading('second1')).toBeDefined()
  expect(screen.getByText(schoolLessonWordPosition({ number: 1, count: 1 }))).toBeDefined()
  expect(screen.queryByRole('button', { name: schoolLessonWordNext() })).toBeNull()
})

it('never shows a word that carries no reading', async () => {
  const heldOut: LessonWord = { wordId: 'id-say', standing: 'notStarted', reading: null }
  const town = townOf({
    lessons: [lessonOf(1, [heldOut, readableWord('time')])],
    lessonSlot: running('lesson-1'),
  })
  await showLesson('/school/lesson-1', town)

  expect(screen.getByText(schoolLessonWordPosition({ number: 1, count: 1 }))).toBeDefined()
  expect(screen.queryByText('id-say')).toBeNull()
})

const notStartedWord: LessonWord = { wordId: 'id-word', standing: 'notStarted', reading: null }

it.each([
  ['a stopped or an unstudied lesson', '/school/lesson-1', [lessonOf(1, [notStartedWord])]],
  ['a lesson with every word reviewed', '/school/lesson-1', [lessonOf(1, [reviewedWord('x')])]],
  ['an unknown lesson', '/school/lesson-99', [unreadLessonOf(1)]],
])('shows nothing to read for %s, with a way back to the school', async (_, path, lessons) => {
  await showLesson(path, townOf({ lessons }))

  expect(screen.getByText(schoolLessonNothingToRead())).toBeDefined()
  await follow(screen.getByRole('link', { name: townGoToSchool() }))
  expect(screen.getByRole('heading', { level: 2, name: namesPlacesSchool() })).toBeDefined()
})

it('walks every unread lesson in curriculum order and then the reviews', async () => {
  const readFirst = ['lesson-1', 'lesson-2', 'lesson-3']
  await showLesson('/school/lesson-1', lessonsFinished([1, 2, 3]), {
    report: async () => ({ ok: true, value: reportOf(readFirst) }),
  })

  await follow(nextLesson())
  expect(lessonHeading(2)).toBeDefined()
  await follow(nextLesson())
  expect(lessonHeading(3)).toBeDefined()

  expect(startReviews().getAttribute('href')).toBe('/reviews')
  expect(screen.queryByRole('link', { name: schoolLessonNext() })).toBeNull()
  await follow(startReviews())
  expect(screen.getByRole('heading', { level: 2, name: reviewTitle() })).toBeDefined()
})

it('starts each lesson of the walk at its first word', async () => {
  await showLesson('/school/lesson-1', lessonsFinished([1, 2]), {
    report: async () => ({ ok: true, value: reportOf(['lesson-1', 'lesson-2']) }),
  })

  await follow(nextWord())
  await follow(nextLesson())

  expect(wordHeading('first2')).toBeDefined()
})

it('reaches every unread lesson when entered out of order', async () => {
  const readFirst = ['lesson-1', 'lesson-2', 'lesson-3']
  await showLesson('/school/lesson-3', lessonsFinished([1, 2, 3]), {
    report: async () => ({ ok: true, value: reportOf(readFirst) }),
  })

  await follow(nextLesson())
  expect(lessonHeading(1)).toBeDefined()
  await follow(nextLesson())
  expect(lessonHeading(2)).toBeDefined()

  expect(startReviews().getAttribute('href')).toBe('/reviews')
})

it('counts a lesson outside readFirst as entered', async () => {
  await showLesson('/school/lesson-3', lessonsFinished([1, 2, 3]), {
    report: async () => ({ ok: true, value: reportOf(['lesson-1', 'lesson-2']) }),
  })

  await follow(nextLesson())
  expect(lessonHeading(1)).toBeDefined()
  await follow(nextLesson())
  expect(lessonHeading(2)).toBeDefined()

  expect(startReviews().getAttribute('href')).toBe('/reviews')
})

it('sends no write while the player reads', async () => {
  const calls = new Set<string>()
  const client = stubApiClient({
    currentPlayer: async () => knownPlayer,
    town: async () => ({ ok: true, value: lessonsFinished([1, 2]) }),
    report: async () => ({ ok: true, value: reportOf(['lesson-1', 'lesson-2']) }),
  })
  const recording = new Proxy(client, {
    get: (target, name, receiver) => {
      const member = Reflect.get(target, name, receiver)
      calls.add(String(name))
      return member
    },
  })
  renderAppAt('/school/lesson-1', recording)
  await passSeconds(0)

  await follow(nextWord())
  await follow(nextLesson())
  await follow(nextWord())

  const reads = ['currentPlayer', 'town', 'report', 'fiefs', 'digest']
  expect([...calls].filter((name) => !reads.includes(name))).toEqual([])
})

it('shows the town loading before the first read', async () => {
  const unanswered = new Promise<ApiOutcome<TownOverview>>(() => undefined)
  await showLesson('/school/lesson-1', townOf({}), { town: () => unanswered })

  expect(screen.getByText(townLoading())).toBeDefined()
})

it('retries a failed town read', async () => {
  let reads = 0
  await showLesson('/school/lesson-1', townOf({}), {
    town: async () => {
      reads += 1
      return reads === 1 ? { ok: false, refusal: 'Unexpected' } : { ok: true, value: townOf({}) }
    },
  })

  await follow(screen.getByRole('button', { name: townTryAgain() }))

  expect(wordHeading('first1')).toBeDefined()
})

it('retries a failed Report read', async () => {
  let reads = 0
  await showLesson('/school/lesson-1', townOf({}), {
    report: async () => {
      reads += 1
      return reads === 1 ? { ok: false, refusal: 'Unexpected' } : { ok: true, value: reportOf([]) }
    },
  })

  await follow(screen.getByRole('button', { name: townTryAgain() }))

  expect(wordHeading('first1')).toBeDefined()
})
