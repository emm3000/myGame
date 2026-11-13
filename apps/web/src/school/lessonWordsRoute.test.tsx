import {
  namesPlacesSchool,
  reportLoading,
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
import type { Report, TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import {
  answeringOnDemand,
  holdSeconds,
  refusedRead,
  revealSeconds,
  skeletonBlocks,
} from '../design-system/loadingSkeleton.testSupport'
import { inkPills } from './inkPills.testSupport'

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
  reading: {
    word,
    gloss: `gloss of ${word}`,
    frame: [{ text: `A frame of ${word}.`, support: null }],
  },
  support: { shown: 'beside', text: `gloss of ${word}`, language: 'es' },
})

const reviewedWord = (word: string): LessonWord => ({
  wordId: `id-${word}`,
  standing: 'recall',
  reading: null,
  support: { shown: 'beside', text: 'gloss', language: 'es' },
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
  screen.getByRole('heading', { level: 2, name: word })

const wordBlock = (word: string): HTMLElement => screen.getByRole('region', { name: word })

const nextWord = (): HTMLElement => screen.getByRole('button', { name: schoolLessonWordNext() })

const startReviews = (): HTMLElement =>
  within(screen.getByRole('main')).getByRole('link', { name: reportStartReviews() })

const nextLesson = (): HTMLElement => screen.getByRole('link', { name: schoolLessonNext() })

const lessonHeading = (number: number): HTMLElement =>
  screen.getByRole('heading', { level: 1, name: schoolLessonTitle({ number }) })

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
  const silhouetteOn = (word: string): Element | null =>
    wordBlock(word).querySelector('svg [fill="var(--on-block)"]')

  expect(silhouetteOn('school')).not.toBeNull()

  await follow(nextWord())

  expect(silhouetteOn('money')).toBeNull()
})

it("sets the silhouette on the word's block, since on-block vanishes on paper", async () => {
  const town = townOf({
    lessons: [lessonOf(1, [readableWord('school')])],
    lessonSlot: running('lesson-1'),
  })
  await showLesson('/school/lesson-1', town)

  expect(wordBlock('school').querySelector('svg [fill="var(--on-block)"]')).not.toBeNull()
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
  const heldOut: LessonWord = {
    wordId: 'id-say',
    standing: 'notStarted',
    reading: null,
    support: null,
  }
  const town = townOf({
    lessons: [lessonOf(1, [heldOut, readableWord('time')])],
    lessonSlot: running('lesson-1'),
  })
  await showLesson('/school/lesson-1', town)

  expect(screen.getByText(schoolLessonWordPosition({ number: 1, count: 1 }))).toBeDefined()
  expect(screen.queryByText('id-say')).toBeNull()
})

const notStartedWord: LessonWord = {
  wordId: 'id-word',
  standing: 'notStarted',
  reading: null,
  support: { shown: 'beside', text: 'gloss', language: 'es' },
}

it.each([
  ['a stopped or an unstudied lesson', '/school/lesson-1', [lessonOf(1, [notStartedWord])]],
  ['a lesson with every word reviewed', '/school/lesson-1', [lessonOf(1, [reviewedWord('x')])]],
  ['an unknown lesson', '/school/lesson-99', [unreadLessonOf(1)]],
])('shows nothing to read for %s, with a way back to the school', async (_, path, lessons) => {
  await showLesson(path, townOf({ lessons }))

  expect(screen.getByText(schoolLessonNothingToRead())).toBeDefined()
  await follow(screen.getByRole('link', { name: townGoToSchool() }))
  expect(screen.getByRole('heading', { level: 1, name: namesPlacesSchool() })).toBeDefined()
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
  expect(screen.getByRole('heading', { level: 1, name: reviewTitle() })).toBeDefined()
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

  const reads: ReadonlyArray<keyof ApiClient> = ['currentPlayer', 'town', 'report']
  const allowed = new Set<string>(reads)
  expect([...calls].filter((name) => !allowed.has(name))).toEqual([])
})

const townNeverAnswers: ApiClient['town'] = () => new Promise(() => undefined)

const reportNeverAnswers: ApiClient['report'] = () => new Promise(() => undefined)

const firstWordLine = (): HTMLElement | null => screen.queryByText('first1')

it('keeps the town loading line in a status region before the first read', async () => {
  await showLesson('/school/lesson-1', townOf({}), { town: townNeverAnswers })

  expect(screen.getByRole('status').textContent).toBe(townLoading())
})

it('keeps the report loading line in a status region while the Report reads', async () => {
  await showLesson('/school/lesson-1', townOf({}), { report: reportNeverAnswers })

  expect(screen.getByRole('status').textContent).toBe(reportLoading())
})

it('never draws the loading line of the words on the screen', async () => {
  await showLesson('/school/lesson-1', townOf({}), { report: reportNeverAnswers })

  expect(screen.getByRole('status').className.split(' ')).toContain('sr-only')
})

it('draws no skeleton when the Report answers inside the reveal delay', async () => {
  const slow = answeringOnDemand(reportOf([]))
  await showLesson('/school/lesson-1', townOf({}), { report: slow.read })
  await passSeconds(revealSeconds / 2)

  slow.answer()
  await passSeconds(0)

  expect(skeletonBlocks()).toEqual([])
  expect(firstWordLine()).not.toBeNull()
})

it('shows the skeleton when the Report read is slow', async () => {
  await showLesson('/school/lesson-1', townOf({}), { report: reportNeverAnswers })

  await passSeconds(revealSeconds)

  expect(skeletonBlocks().length).toBeGreaterThan(0)
  expect(firstWordLine()).toBeNull()
})

it('shows the skeleton when the town read is slow', async () => {
  await showLesson('/school/lesson-1', townOf({}), { town: townNeverAnswers })

  await passSeconds(revealSeconds)

  expect(skeletonBlocks().length).toBeGreaterThan(0)
})

it('counts one reveal delay across the town read and the Report read', async () => {
  const slowTown = answeringOnDemand(townOf({}))
  await showLesson('/school/lesson-1', townOf({}), {
    town: slowTown.read,
    report: reportNeverAnswers,
  })
  await passSeconds(revealSeconds / 2)
  slowTown.answer()
  await passSeconds(0)

  await passSeconds(revealSeconds / 2)

  expect(skeletonBlocks().length).toBeGreaterThan(0)
})

it('keeps the skeleton for the minimum hold when the Report answers just after it appears', async () => {
  const slow = answeringOnDemand(reportOf([]))
  await showLesson('/school/lesson-1', townOf({}), { report: slow.read })
  await passSeconds(revealSeconds)

  slow.answer()
  await passSeconds(holdSeconds / 2)

  expect(skeletonBlocks().length).toBeGreaterThan(0)
  expect(firstWordLine()).toBeNull()
})

it('draws the word once the minimum hold ends', async () => {
  const slow = answeringOnDemand(reportOf([]))
  await showLesson('/school/lesson-1', townOf({}), { report: slow.read })
  await passSeconds(revealSeconds)
  slow.answer()

  await passSeconds(holdSeconds)

  expect(skeletonBlocks()).toEqual([])
  expect(firstWordLine()).not.toBeNull()
})

it('keeps the school title above the skeleton of the words', async () => {
  await showLesson('/school/lesson-1', townOf({}), { report: reportNeverAnswers })

  await passSeconds(revealSeconds)

  expect(screen.getByRole('heading', { level: 1, name: namesPlacesSchool() })).toBeDefined()
})

it('holds the skeleton to the column of the words', async () => {
  await showLesson('/school/lesson-1', townOf({}), { report: reportNeverAnswers })

  await passSeconds(revealSeconds)

  expect(document.querySelector('.max-w-form [data-skeleton-block]')).not.toBeNull()
})

it.each<[string, Partial<ApiClient>]>([
  ['town', { town: refusedRead }],
  ['Report', { report: refusedRead }],
])('draws no skeleton on a refused %s read, only the retry', async (_read, overrides) => {
  await showLesson('/school/lesson-1', townOf({}), overrides)

  await passSeconds(revealSeconds + holdSeconds)

  expect(skeletonBlocks()).toEqual([])
  expect(screen.getByRole('button', { name: townTryAgain() })).toBeDefined()
})

it('draws the refused town at once while the Report still reads', async () => {
  await showLesson('/school/lesson-1', townOf({}), {
    town: refusedRead,
    report: reportNeverAnswers,
  })

  expect(screen.getByRole('button', { name: townTryAgain() })).toBeDefined()
  expect(screen.queryByRole('status')).toBeNull()
})

const fromTheSchool = async (report: ApiClient['report']): Promise<void> => {
  const town = vi
    .fn<ApiClient['town']>()
    .mockResolvedValueOnce({ ok: true, value: townOf({}) })
    .mockImplementation(townNeverAnswers)
  const router = renderAppAt(
    '/school',
    stubApiClient({ currentPlayer: async () => knownPlayer, town, report }),
  )
  await passSeconds(0)
  await act(() => router.navigate({ to: '/school/$lessonId', params: { lessonId: 'lesson-1' } }))
  await passSeconds(0)
}

it('reads the held town with no town loading line when coming from the school', async () => {
  await fromTheSchool(reportNeverAnswers)

  expect(screen.getByRole('status').textContent).toBe(reportLoading())
})

it('draws the word of the held town with no loading state on a fast Report', async () => {
  await fromTheSchool(async () => ({ ok: true, value: reportOf([]) }))

  expect(firstWordLine()).not.toBeNull()
  expect(screen.queryByRole('status')).toBeNull()
  expect(skeletonBlocks()).toEqual([])
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

const fiveWordLessonOf = (number: number): Lesson =>
  lessonOf(
    number,
    ['a', 'b', 'c', 'd', 'e'].map((letter) => readableWord(`${letter}${number}`)),
  )

const isBefore = (earlier: Element, later: Element): boolean =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

it('sets the word and its frame in one block', async () => {
  await showLesson('/school/lesson-1', townOf({}))

  expect(within(wordBlock('first1')).getByText('A frame of first1.')).toBeDefined()
  expect(within(wordBlock('first1')).getByText('gloss of first1')).toBeDefined()
})

it('draws the progress line above the word', async () => {
  await showLesson('/school/lesson-1', townOf({ lessonSlot: running('lesson-1') }))

  const progress = (): HTMLElement => within(screen.getByRole('main')).getByRole('progressbar')
  expect(isBefore(progress(), wordBlock('first1'))).toBe(true)
  expect(progress().getAttribute('aria-valuenow')).toBe('50')

  await follow(nextWord())

  expect(progress().getAttribute('aria-valuenow')).toBe('100')
})

it('puts the way on under the block', async () => {
  const town = townOf({ lessons: [lessonOf(1, [readableWord('only')])] })
  await showLesson('/school/lesson-1', town)

  expect(within(wordBlock('only')).queryByRole('link')).toBeNull()
  expect(isBefore(wordBlock('only'), startReviews())).toBe(true)
})

it('changes the hue with the next word', async () => {
  await showLesson('/school/lesson-1', townOf({ lessons: [fiveWordLessonOf(1)] }))

  const hues: Array<string | null> = [wordBlock('a1').getAttribute('data-hue')]
  for (const word of ['b1', 'c1', 'd1', 'e1']) {
    await follow(nextWord())
    hues.push(wordBlock(word).getAttribute('data-hue'))
  }

  expect(hues).toEqual(['peach', 'mint', 'periwinkle', 'lavender', 'peach'])
})

it('changes the hue when the way on opens the next lesson', async () => {
  const town = townOf({ lessons: [fiveWordLessonOf(1), fiveWordLessonOf(2)] })
  await showLesson('/school/lesson-1', town, {
    report: async () => ({ ok: true, value: reportOf(['lesson-1', 'lesson-2']) }),
  })

  for (let step = 0; step < 4; step += 1) {
    await follow(nextWord())
  }
  const lastHue = wordBlock('e1').getAttribute('data-hue')
  await follow(nextLesson())

  expect(wordBlock('a2').getAttribute('data-hue')).not.toBe(lastHue)
})

it('wraps a long word rather than clipping it', async () => {
  const longWord = 'antidisestablishmentarianism'.repeat(3)
  await showLesson('/school/lesson-1', townOf({ lessons: [lessonOf(1, [readableWord(longWord)])] }))

  expect(wordHeading(longWord).className).toContain('wrap-anywhere')
})

it.each<[string, Partial<TownOverview>, ReadonlyArray<() => string>]>([
  ['a running lesson on a word', { lessonSlot: running('lesson-1') }, [schoolLessonWordNext]],
  ['a finished lesson on a word', {}, [schoolLessonWordNext]],
  [
    'a finished lesson on its only word',
    { lessons: [lessonOf(1, [readableWord('only')])] },
    [reportStartReviews],
  ],
  [
    'a running lesson on its only word',
    { lessons: [lessonOf(1, [readableWord('only')])], lessonSlot: running('lesson-1') },
    [],
  ],
])('holds at most one ink pill on the words with %s', async (_state, overrides, labels) => {
  await showLesson('/school/lesson-1', townOf(overrides))

  expect(inkPills()).toEqual(labels.map((label) => label()))
})

it('holds no ink pill on the words with nothing to read', async () => {
  await showLesson('/school/lesson-99', townOf({}))

  expect(inkPills()).toEqual([])
})

it.each<[string, string, Partial<ApiClient>, () => string]>([
  ['a word', '/school/lesson-1', {}, () => schoolLessonTitle({ number: 1 })],
  ['nothing to read', '/school/lesson-99', {}, namesPlacesSchool],
  [
    'the town loading',
    '/school/lesson-1',
    { town: () => new Promise(() => undefined) },
    namesPlacesSchool,
  ],
  [
    'a failed read',
    '/school/lesson-1',
    { town: async () => ({ ok: false, refusal: 'Unexpected' }) },
    namesPlacesSchool,
  ],
])('holds one h1 on the words with %s', async (_state, path, overrides, title) => {
  await showLesson(path, townOf({}), overrides)

  expect(screen.getAllByRole('heading', { level: 1 }).map((h1) => h1.textContent)).toEqual([
    title(),
  ])
})
