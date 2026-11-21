import { en, es } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import type { WordStanding } from '@mygame/domain'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { accessibleDescriptionOf } from '../design-system/accessibleDescriptionOf.testSupport'
import { formatDuration } from '../design-system/formatDuration'
import {
  answeringOnDemand,
  holdSeconds,
  neverAnswering,
  revealSeconds,
  skeletonBlocks,
} from '../design-system/loadingSkeleton.testSupport'
import { finishSeparator } from '../time/finishSeparator'
import { formatTimeLeft } from '../time/formatTimeLeft'
import { shownLinesDrawnAlone } from '../town/lineDrawnAlone.testSupport'
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

const lessonOf = (number: number, overrides: Partial<Lesson> = {}): Lesson => ({
  id: `lesson-${number}`,
  theme: `Theme ${number}`,
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  isStudied: false,
  words: Array.from({ length: 5 }, (_, index) => ({
    wordId: `lesson-${number}-${index + 1}`,
    standing: 'notStarted',
    reading: null,
    support: { shown: 'beside', text: 'gloss', language: 'es' },
  })),
  ...overrides,
})

const schoolOf = (overrides: Partial<TownOverview>): TownOverview => ({
  ...knownTown,
  lessons: [lessonOf(1)],
  ...overrides,
})

const lessonOneStudying: TownOverview['lessonSlot'] = {
  lessonId: 'lesson-1',
  startedAt: instantAfter(-60),
  finishesAt: instantAfter(240),
}

const showSchool = async (
  town: TownOverview,
  overrides: Partial<ApiClient> = {},
  path = '/school',
): Promise<void> => {
  renderAppAt(
    path,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      town: async () => ({ ok: true, value: town }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const lessonRow = (number: number): HTMLElement =>
  screen.getByRole('listitem', { name: `Lección ${number}` })

const lessonBlock = (number: number): HTMLElement =>
  screen.getByRole('region', { name: es.schoolLessonTitle({ number }) })

const studyLabelOf = (number: number): string => `${es.schoolLessonStudy({ number })} · 5:00`

const studyButtonOf = (number: number): HTMLElement =>
  screen.getByRole('button', { name: studyLabelOf(number) })

const readWordsOfLessonOne = (): string =>
  `${es.schoolLessonTitle({ number: 1 })} · ${es.schoolLessonReadWords()}`

const selectRow = async (number: number): Promise<void> => {
  fireEvent.click(within(lessonRow(number)).getByRole('button'))
  await passSeconds(0)
}

const wordsOf = (...standings: ReadonlyArray<WordStanding>): Lesson['words'] =>
  standings.map((standing, index) => ({
    wordId: `word-${index + 1}`,
    standing,
    reading: null,
    support: { shown: 'beside', text: 'gloss', language: 'es' },
  }))

const studiedLessonOf = (...standings: ReadonlyArray<WordStanding>): Lesson =>
  lessonOf(1, { isStudied: true, words: wordsOf(...standings) })

const pathOf = (number: number): ReadonlyArray<string> => {
  const row = within(lessonRow(number))
  const counts = row.getAllByRole('definition')
  return row
    .getAllByRole('term')
    .map((label, index) => `${label.textContent} ${counts[index]?.textContent}`)
}

const pathLinesOf = (
  studied: number,
  read: number,
  reviewed: number,
  learned: number,
  total: number,
): ReadonlyArray<string> => [
  `${es.schoolPathStudied()} ${es.schoolPathCount({ count: studied, total })}`,
  `${es.schoolPathRead()} ${es.schoolPathCount({ count: read, total })}`,
  `${es.schoolPathReviewed()} ${es.schoolPathCount({ count: reviewed, total })}`,
  `${es.schoolPathLearned()} ${es.schoolPathCount({ count: learned, total })}`,
]

const isBefore = (earlier: Element, later: Element): boolean =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

const studiedThrough = (studied: number, count: number): Array<Lesson> =>
  Array.from({ length: count }, (_, index) => lessonOf(index + 1, { isStudied: index < studied }))

it('counts the words past each standing', async () => {
  const lesson = studiedLessonOf('recognize', 'recall', 'hold', 'hold', 'retained')
  await showSchool(schoolOf({ lessons: [lesson, lessonOf(2)] }))

  expect(pathOf(1)).toEqual(pathLinesOf(5, 4, 3, 1, 5))
})

it('leaves a held-out word out of the count', async () => {
  const lesson = studiedLessonOf('notStarted', 'recall', 'hold', 'hold', 'retained')
  await showSchool(schoolOf({ lessons: [lesson, lessonOf(2)] }))

  expect(pathOf(1)).toEqual(pathLinesOf(4, 4, 3, 1, 4))
})

it('shows a word moved back after a wrong recall', async () => {
  let lesson = studiedLessonOf('hold', 'hold', 'hold', 'hold', 'hold')
  const read = (): TownOverview => schoolOf({ lessons: [lesson, lessonOf(2)] })
  await showSchool(read(), { town: async () => ({ ok: true, value: read() }) })
  expect(pathOf(1)).toEqual(pathLinesOf(5, 5, 5, 0, 5))

  lesson = studiedLessonOf('recall', 'hold', 'hold', 'hold', 'hold')
  await passSeconds(60)

  expect(pathOf(1)).toEqual(pathLinesOf(5, 5, 4, 0, 5))
})

it('shows every word of a lesson past the last standing', async () => {
  const lesson = studiedLessonOf('retained', 'retained', 'retained', 'retained', 'retained')
  await showSchool(schoolOf({ lessons: [lesson, lessonOf(2)] }))

  expect(pathOf(1)).toEqual(pathLinesOf(5, 5, 5, 5, 5))
})

it('shows no date and no days away on the path', async () => {
  const lesson = studiedLessonOf('recognize', 'recall', 'hold', 'hold', 'retained')
  await showSchool(schoolOf({ lessons: [lesson, lessonOf(2)], nextDueAt: instantAfter(86_400) }))

  expect(lessonRow(1).textContent).not.toMatch(/d[ií]as?\b|\bma[ñn]ana\b|semanas?\b|\d:\d|\/\d/i)
  expect(pathOf(1)).toHaveLength(4)
})

it('draws no path on a lesson with no word held', async () => {
  await showSchool(schoolOf({ lessons: [lessonOf(1), lessonOf(2)] }))

  expect(within(lessonRow(2)).queryByRole('term')).toBeNull()
})

it("reads the next lesson's reward as one line, from its words to the skill to the rate", async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(1, 3) }))

  const reward = `${es.schoolLessonWords({ count: 5 })} · ${es.schoolLessonReward({ percent: 5, resource: 'comida' })}`
  expect(lessonBlock(2).textContent).toContain(reward)
})

it('puts the next lesson first', async () => {
  const studied = lessonOf(1, { isStudied: true, words: wordsOf('recall') })
  await showSchool(schoolOf({ lessons: [studied, lessonOf(2), lessonOf(3)] }))

  expect(isBefore(lessonBlock(2), lessonRow(1))).toBe(true)
  expect(isBefore(lessonBlock(2), lessonRow(3))).toBe(true)
})

it("opens the unread lesson from the school's link", async () => {
  const lessons = [lessonOf(1, { isStudied: true }), lessonOf(2)]
  await showSchool(
    schoolOf({ lessons, nextStep: { kind: 'reviews', count: 2, readFirst: ['lesson-1'] } }),
  )

  const link = screen.getByRole('link', { name: readWordsOfLessonOne() })
  expect(link.getAttribute('href')).toBe('/school/lesson-1')
  expect(inkPills()).toEqual([studyLabelOf(2)])
})

it("tells the school's link from the running lesson's pill", async () => {
  const lessons = [lessonOf(1, { isStudied: true }), lessonOf(2), lessonOf(3)]
  const running = { ...lessonOneStudying, lessonId: 'lesson-2' }
  await showSchool(
    schoolOf({
      lessons,
      lessonSlot: running,
      nextStep: { kind: 'reviews', count: 2, readFirst: ['lesson-1'] },
    }),
  )

  await selectRow(2)

  const pill = screen.getByRole('link', { name: es.schoolLessonReadWords() })
  const link = screen.getByRole('link', { name: readWordsOfLessonOne() })
  expect(pill.getAttribute('href')).toBe('/school/lesson-2')
  expect(link.getAttribute('href')).toBe('/school/lesson-1')
})

it('leaves the reviews to the one pill once every lesson is studied', async () => {
  await showSchool(
    schoolOf({
      lessons: studiedThrough(2, 2),
      nextStep: { kind: 'reviews', count: 2, readFirst: [] },
    }),
  )

  expect(screen.getAllByRole('link', { name: es.reportStartReviews() })).toHaveLength(1)
})

it("opens the reviews from the school's link once no lesson is unread", async () => {
  const lessons = [lessonOf(1, { isStudied: true }), lessonOf(2)]
  await showSchool(schoolOf({ lessons, nextStep: { kind: 'reviews', count: 2, readFirst: [] } }))

  const link = screen.getByRole('link', { name: es.reportStartReviews() })
  expect(link.getAttribute('href')).toBe('/reviews')
})

it('shows no link to the reviews when none is due', async () => {
  const lessons = [lessonOf(1, { isStudied: true }), lessonOf(2)]
  await showSchool(schoolOf({ lessons, nextStep: { kind: 'lessonToStudy', lessonId: 'lesson-2' } }))

  expect(screen.queryByRole('link', { name: es.reportStartReviews() })).toBeNull()
  expect(screen.queryByRole('link', { name: es.schoolLessonReadWords() })).toBeNull()
})

it('opens the school from the town home', async () => {
  await showSchool(schoolOf({}), {}, '/')

  fireEvent.click(screen.getByRole('link', { name: es.townGoToSchool() }))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 1, name: es.namesPlacesSchool() })).toBeDefined()
})

it('starts lesson 1 from the school', async () => {
  const started: Array<string> = []
  await showSchool(schoolOf({}), {
    startLesson: async (lessonId) => {
      started.push(lessonId)
      return { ok: true, value: schoolOf({ lessonSlot: lessonOneStudying }) }
    },
  })

  fireEvent.click(studyButtonOf(1))
  await passSeconds(0)

  expect(started).toEqual(['lesson-1'])
  expect(within(screen.getByRole('main')).getByRole('timer').textContent).toBe('4 min')
})

it("opens a running lesson's words from the school", async () => {
  await showSchool(schoolOf({ lessonSlot: lessonOneStudying }))

  const readWords = screen.getByRole('link', { name: es.schoolLessonReadWords() })

  expect(readWords.getAttribute('href')).toBe('/school/lesson-1')
})

it("opens the running lesson's words from under another lesson's block", async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(0, 2), lessonSlot: lessonOneStudying }))

  const readWords = screen.getByRole('link', { name: readWordsOfLessonOne() })

  expect(readWords.getAttribute('href')).toBe('/school/lesson-1')
})

it('offers no words to read while no lesson runs', async () => {
  await showSchool(schoolOf({}))

  expect(screen.queryByRole('link', { name: es.schoolLessonReadWords() })).toBeNull()
})

it('shows a running lesson’s countdown', async () => {
  const studying = schoolOf({ lessonSlot: lessonOneStudying })
  await showSchool(studying, {
    town: async () => ({
      ok: true,
      value: { ...studying, readAt: new Date(Date.now()).toISOString() },
    }),
  })

  expect(within(screen.getByRole('main')).getByRole('timer').textContent).toBe('4 min')

  await passSeconds(190)

  expect(within(screen.getByRole('main')).getByRole('timer').textContent).toBe('0:50')
})

it('reads the town again when the lesson finishes and marks it studied', async () => {
  const finishesAt = readAt + 50_000
  const studyingAt = (nowMs: number): TownOverview =>
    schoolOf({
      lessonSlot: {
        lessonId: 'lesson-1',
        startedAt: instantAfter(-250),
        finishesAt: instantAfter(50),
      },
      readAt: new Date(nowMs).toISOString(),
    })
  const studied = schoolOf({
    lessons: [lessonOf(1, { isStudied: true })],
    readAt: instantAfter(50),
  })
  let answerFinishRead: (outcome: ApiOutcome<TownOverview>) => void = () => undefined
  let reads = 0
  await showSchool(studyingAt(readAt), {
    town: () => {
      reads += 1
      return Date.now() < finishesAt
        ? Promise.resolve({ ok: true, value: studyingAt(Date.now()) })
        : new Promise((resolve) => {
            answerFinishRead = resolve
          })
    },
  })

  await passSeconds(49)
  expect(reads).toBe(1)

  await passSeconds(1)
  expect(reads).toBe(2)
  expect(screen.getByText(es.schoolSlotDone())).toBeDefined()

  await act(async () => answerFinishRead({ ok: true, value: studied }))
  expect(within(lessonRow(1)).getByText(es.schoolLessonStudied())).toBeDefined()
})

it('stops a lesson once on a double click', async () => {
  let answer: (outcome: ApiOutcome<TownOverview>) => void = () => undefined
  const stopLesson = vi.fn(
    () =>
      new Promise<ApiOutcome<TownOverview>>((resolve) => {
        answer = resolve
      }),
  )
  await showSchool(schoolOf({ lessonSlot: lessonOneStudying }), { stopLesson })

  const stop = screen.getByRole('button', { name: es.schoolSlotStopOf({ number: 1 }) })
  act(() => {
    fireEvent.click(stop)
    fireEvent.click(stop)
  })
  await act(async () => answer({ ok: true, value: schoolOf({}) }))

  expect(stopLesson).toHaveBeenCalledTimes(1)
})

it('marks a lesson whose school level is too low with the level', async () => {
  await showSchool(
    schoolOf({
      lessons: [lessonOf(1, { isStudied: true }), lessonOf(2, { requiredSchoolLevel: 2 })],
    }),
  )

  const study = studyButtonOf(2)
  expect(accessibleDescriptionOf(study)).toBe(es.schoolLessonNeedsSchool({ level: 2 }))
})

it('marks a lesson past the cap before the tap with the words in learning', async () => {
  await showSchool(
    schoolOf({
      learning: { cap: 15, inLearning: 12, retainedWords: null, nextInLearningDueAt: null },
    }),
  )

  expect(screen.getByText(es.schoolLearning({ inLearning: 12, cap: 15 }))).toBeDefined()
  expect(accessibleDescriptionOf(studyButtonOf(1))).toBe(
    es.schoolLessonCapReached({ inLearning: 12, cap: 15, count: 5 }),
  )
})

it('refuses a lesson past the cap and names the cap', async () => {
  await showSchool(schoolOf({}), {
    startLesson: async () => ({
      ok: false,
      refusal: 'LearningCapReached',
      error: { kind: 'LearningCapReached', params: { learningCap: 15, cardsInLearning: 12 } },
    }),
  })

  fireEvent.click(studyButtonOf(1))
  await passSeconds(0)

  expect(within(screen.getByRole('main')).getByRole('alert').textContent).toBe(
    es.refusalLearningCapReached({ learningCap: 15, cardsInLearning: 12 }),
  )
})

const nextWordDueIn = '2 h 15 min · 12:15'

const reviewsDue: TownOverview['nextStep'] = { kind: 'reviews', count: 2, readFirst: [] }

const fullCapWaiting: TownOverview['learning'] = {
  cap: 15,
  inLearning: 12,
  retainedWords: null,
  nextInLearningDueAt: instantAfter(2 * 3600 + 15 * 60),
}

const capRefused: Partial<ApiClient> = {
  startLesson: async () => ({
    ok: false,
    refusal: 'LearningCapReached',
    error: { kind: 'LearningCapReached', params: { learningCap: 15, cardsInLearning: 12 } },
  }),
}

it('a full cap with no review due names when the next word in learning is due', async () => {
  await showSchool(schoolOf({ learning: fullCapWaiting }))

  expect(
    screen.getByText(es.schoolLearningFullNextWordDue({ count: 5, timeLeft: nextWordDueIn })),
  ).toBeDefined()
  expect(screen.queryByText(es.schoolLearningFull({ count: 5 }))).toBeNull()
})

it('a full cap with a review due still sends to the reviews', async () => {
  await showSchool(schoolOf({ learning: fullCapWaiting, nextStep: reviewsDue }))

  expect(screen.getByText(es.schoolLearningFull({ count: 5 }))).toBeDefined()
})

const refusedPastTheCapIn = async (
  language: Pick<TownOverview, 'scaffold' | 'chromePhase'>,
): Promise<string | null | undefined> => {
  await showSchool(
    schoolOf({
      ...language,
      learning: { ...fullCapWaiting, inLearning: 0, nextInLearningDueAt: instantAfter(20 * 3600) },
    }),
    capRefused,
  )
  fireEvent.click(screen.getByRole('button', { name: /· 5:00$/ }))
  await passSeconds(0)
  return within(screen.getByRole('main')).getByRole('alert').textContent
}

it('keeps the cap refusal in Spanish for an es player in the English phase', async () => {
  expect(await refusedPastTheCapIn({ scaffold: 'es', chromePhase: 'english' })).toBe(
    es.refusalLearningCapNextWordDue({
      learningCap: 15,
      cardsInLearning: 12,
      timeLeft: `${formatTimeLeft(20 * 3600)} ${finishSeparator} ${es.statusTomorrow({ time: '06:00' })}`,
    }),
  )
})

it('writes the cap refusal in English under none', async () => {
  expect(await refusedPastTheCapIn({ scaffold: 'none', chromePhase: 'english' })).toBe(
    en.refusalLearningCapNextWordDue({
      learningCap: 15,
      cardsInLearning: 12,
      timeLeft: `${formatTimeLeft(20 * 3600)} ${finishSeparator} ${en.statusTomorrow({ time: '06:00' })}`,
    }),
  )
})

it('refuses a lesson past the cap with no review due and names when the next word is due', async () => {
  await showSchool(schoolOf({ learning: { ...fullCapWaiting, inLearning: 0 } }), capRefused)

  fireEvent.click(studyButtonOf(1))
  await passSeconds(0)

  expect(within(screen.getByRole('main')).getByRole('alert').textContent).toBe(
    es.refusalLearningCapNextWordDue({
      learningCap: 15,
      cardsInLearning: 12,
      timeLeft: nextWordDueIn,
    }),
  )
})

it('refuses a lesson past the cap with a review due and sends to the reviews', async () => {
  await showSchool(
    schoolOf({ learning: { ...fullCapWaiting, inLearning: 0 }, nextStep: reviewsDue }),
    capRefused,
  )

  fireEvent.click(studyButtonOf(1))
  await passSeconds(0)

  expect(within(screen.getByRole('main')).getByRole('alert').textContent).toBe(
    es.refusalLearningCapReached({ learningCap: 15, cardsInLearning: 12 }),
  )
})

it('marks a studied lesson with no study button', async () => {
  await showSchool(schoolOf({ lessons: [lessonOf(1, { isStudied: true })] }))

  expect(within(lessonRow(1)).getByText(es.schoolLessonStudied())).toBeDefined()
  expect(within(lessonRow(1)).queryByRole('button')).toBeNull()
})

it('lists each earned skill with its resource and percent', async () => {
  await showSchool(
    schoolOf({
      skills: [
        { lessonId: 'lesson-1', resource: 'food', ratePercent: 5, earnedAt: instantAfter(-90) },
        { lessonId: 'lesson-2', resource: 'material', ratePercent: 5, earnedAt: instantAfter(-60) },
        { lessonId: 'lesson-5', resource: 'food', ratePercent: 5, earnedAt: instantAfter(-30) },
      ],
    }),
  )

  const skills = screen.getAllByRole('listitem', { name: /^Habilidad/ })
  expect(skills.map((skill) => skill.textContent)).toEqual([
    `${es.schoolSkillName({ resource: 'comida', level: 1 })}${es.schoolSkillRate({ percent: 5, resource: 'comida' })}`,
    `${es.schoolSkillName({ resource: 'material', level: 1 })}${es.schoolSkillRate({ percent: 5, resource: 'material' })}`,
    `${es.schoolSkillName({ resource: 'comida', level: 2 })}${es.schoolSkillRate({ percent: 5, resource: 'comida' })}`,
  ])
})

it('says so when no skill is earned', async () => {
  await showSchool(schoolOf({}))

  expect(screen.getByText(es.schoolSkillsNone())).toBeDefined()
})

it('sends a player with no town to name one', async () => {
  await showSchool(schoolOf({}), {
    town: async () => ({ ok: false, refusal: 'TownNotFound' }),
  })

  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 2, name: es.townNamingTitle() })).toBeDefined()
})

it('reads the school while the town loads', async () => {
  renderAppAt(
    '/school',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      town: () => new Promise(() => undefined),
    }),
  )
  await passSeconds(0)

  expect(screen.getByRole('status').textContent).toBe(es.townLoading())
})

it('retries a failed read of the school', async () => {
  let reads = 0
  await showSchool(schoolOf({}), {
    town: async () => {
      reads += 1
      return reads === 1 ? { ok: false, refusal: 'Unexpected' } : { ok: true, value: schoolOf({}) }
    },
  })

  fireEvent.click(screen.getByRole('button', { name: es.townTryAgain() }))
  await passSeconds(0)

  expect(lessonBlock(1)).toBeDefined()
})

it('puts the next lesson in a block with its pill under it', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(1, 3) }))

  expect(within(lessonBlock(2)).getByText('Theme 2').getAttribute('lang')).toBe('en')
  expect(within(lessonBlock(2)).queryByRole('button')).toBeNull()
  expect(isBefore(lessonBlock(2), studyButtonOf(2))).toBe(true)
})

it('keeps the order of the block, the pill, the learning load and the rows', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(1, 3) }))

  const load = screen.getByText(es.schoolLearning({ inLearning: 0, cap: 15 }))
  expect(isBefore(studyButtonOf(2), load)).toBe(true)
  expect(isBefore(load, lessonRow(1))).toBe(true)
})

it('lists every other lesson as a row, leaving the next lesson to its block', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(1, 3) }))

  expect(screen.queryByRole('listitem', { name: 'Lección 2' })).toBeNull()
  expect(lessonRow(1)).toBeDefined()
  expect(lessonRow(3)).toBeDefined()
})

it('selects a lesson from its row', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(0, 3) }))

  await selectRow(3)

  expect(lessonBlock(3)).toBeDefined()
  expect(inkPills()).toEqual([studyLabelOf(3)])
  expect(lessonRow(1)).toBeDefined()
  expect(screen.queryByRole('listitem', { name: 'Lección 3' })).toBeNull()
})

it('moves the focus to the block of the selected lesson', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(0, 3) }))

  await selectRow(3)

  expect(document.activeElement).toBe(
    screen.getByRole('heading', { name: es.schoolLessonTitle({ number: 3 }) }),
  )
})

it('starts the selected lesson', async () => {
  const started: Array<string> = []
  await showSchool(schoolOf({ lessons: studiedThrough(0, 3) }), {
    startLesson: async (lessonId) => {
      started.push(lessonId)
      return { ok: true, value: schoolOf({ lessons: studiedThrough(0, 3) }) }
    },
  })

  await selectRow(3)
  fireEvent.click(studyButtonOf(3))
  await passSeconds(0)

  expect(started).toEqual(['lesson-3'])
})

it('keeps a selected lesson in the block once it runs, with its words under it', async () => {
  const lessons = studiedThrough(0, 3)
  await showSchool(schoolOf({ lessons }), {
    startLesson: async () => ({
      ok: true,
      value: schoolOf({
        lessons,
        lessonSlot: {
          lessonId: 'lesson-3',
          startedAt: instantAfter(0),
          finishesAt: instantAfter(300),
        },
      }),
    }),
  })

  await selectRow(3)
  fireEvent.click(studyButtonOf(3))
  await passSeconds(0)

  expect(lessonBlock(3)).toBeDefined()
  expect(inkPills()).toEqual([es.schoolLessonReadWords()])
})

it('offers no selection on a studied lesson', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(1, 2) }))

  expect(within(lessonRow(1)).queryByRole('button')).toBeNull()
})

it('selects the running lesson from its row, with its words as the one pill', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(0, 2), lessonSlot: lessonOneStudying }))

  await selectRow(1)

  expect(lessonBlock(1)).toBeDefined()
  expect(inkPills()).toEqual([es.schoolLessonReadWords()])
  expect(screen.queryByRole('button', { name: studyLabelOf(2) })).toBeNull()
})

it('hides a refused start once another lesson takes the block', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(0, 2) }), {
    startLesson: async () => ({
      ok: false,
      refusal: 'LearningCapReached',
      error: { kind: 'LearningCapReached', params: { learningCap: 15, cardsInLearning: 12 } },
    }),
  })
  fireEvent.click(studyButtonOf(1))
  await passSeconds(0)

  await selectRow(2)

  expect(within(screen.getByRole('main')).queryByRole('alert')).toBeNull()
})

it("takes a lesson's hue from its place in the curriculum", async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(2, 7) }))

  const hueOfRow = async (number: number): Promise<string | null> => {
    await selectRow(number)
    return lessonBlock(number).getAttribute('data-hue')
  }

  expect(lessonBlock(3).getAttribute('data-hue')).toBe('periwinkle')
  expect(await hueOfRow(4)).toBe('lavender')
  expect(await hueOfRow(5)).toBe('peach')
  expect(await hueOfRow(6)).toBe('mint')
  expect(await hueOfRow(7)).toBe('periwinkle')
})

it('says why the next lesson waits while another one runs', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(0, 2), lessonSlot: lessonOneStudying }))

  expect(accessibleDescriptionOf(studyButtonOf(2))).toBe(es.schoolLessonSlotBusy({ number: 1 }))
})

it('draws the running lesson in the block when no other lesson is open', async () => {
  await showSchool(schoolOf({ lessonSlot: lessonOneStudying }))

  expect(within(lessonBlock(1)).getByText('Theme 1')).toBeDefined()
})

it('draws the next step in the block once every lesson is studied', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(2, 2) }))

  const block = screen.getByRole('region', { name: es.townNextTitle() })
  expect(block.getAttribute('data-hue')).toBe('peach')
  expect(within(block).getByText(es.reportNoReviewsDue())).toBeDefined()
  expect(within(block).getByRole('heading', { level: 2, name: es.townNextTitle() })).toBeDefined()
})

const everyLessonStudied = { lessons: studiedThrough(2, 2) }

it.each<[string, Partial<TownOverview>, () => string]>([
  ['no lesson studied', {}, () => studyLabelOf(1)],
  [
    'a lesson running with another open',
    { lessons: studiedThrough(0, 2), lessonSlot: lessonOneStudying },
    readWordsOfLessonOne,
  ],
  ['the last lesson running', { lessonSlot: lessonOneStudying }, es.schoolLessonReadWords],
  [
    "the next lesson locked by the school's level",
    { lessons: [lessonOf(1, { requiredSchoolLevel: 9 })] },
    () => studyLabelOf(1),
  ],
  [
    'the next lesson locked by the cap',
    { learning: { cap: 15, inLearning: 12, retainedWords: null, nextInLearningDueAt: null } },
    () => studyLabelOf(1),
  ],
  ['every lesson studied, nothing due', everyLessonStudied, es.townNextGoToReport],
  [
    'every lesson studied, reviews due',
    { ...everyLessonStudied, nextStep: { kind: 'reviews', count: 2, readFirst: [] } },
    es.reportStartReviews,
  ],
])('holds one ink pill on the school with %s', async (_state, overrides, label) => {
  await showSchool(schoolOf(overrides))

  expect(inkPills()).toEqual([label()])
})

it('holds one ink pill on the school with a row selected', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(0, 16) }))

  await selectRow(9)

  expect(inkPills()).toEqual([studyLabelOf(9)])
})

it('holds one ink pill on the school with a failed read', async () => {
  await showSchool(schoolOf({}), { town: async () => ({ ok: false, refusal: 'Unexpected' }) })

  expect(inkPills()).toEqual([es.townTryAgain()])
})

const schoolLevelLine = (): HTMLElement | null =>
  screen.queryByText(es.townLevel({ level: knownTown.buildings.school.level }))

const townNeverAnswering: Partial<ApiClient> = { town: neverAnswering }

it('keeps the loading line in a status region while the school loads', async () => {
  await showSchool(schoolOf({}), townNeverAnswering)

  expect(screen.getByRole('status').textContent).toBe(es.townLoading())
})

it('renders no skeleton on the school before the reveal delay', async () => {
  await showSchool(schoolOf({}), townNeverAnswering)

  await passSeconds(revealSeconds / 2)

  expect(skeletonBlocks()).toEqual([])
})

it('shows the skeleton on the school when the town read is slow', async () => {
  await showSchool(schoolOf({}), townNeverAnswering)

  await passSeconds(revealSeconds)

  expect(skeletonBlocks().length).toBeGreaterThan(0)
  expect(schoolLevelLine()).toBeNull()
})

it('keeps the school title above the skeleton', async () => {
  await showSchool(schoolOf({}), townNeverAnswering)

  await passSeconds(revealSeconds)

  expect(screen.getByRole('heading', { level: 1, name: es.namesPlacesSchool() })).toBeDefined()
})

it('keeps the school skeleton for the minimum hold when the town answers just after it appears', async () => {
  const slow = answeringOnDemand(schoolOf({}))
  await showSchool(schoolOf({}), { town: slow.read })
  await passSeconds(revealSeconds)

  slow.answer()
  await passSeconds(holdSeconds / 2)

  expect(skeletonBlocks().length).toBeGreaterThan(0)
  expect(schoolLevelLine()).toBeNull()
})

it('draws no skeleton on a refused read of the school, only the retry', async () => {
  await showSchool(schoolOf({}), { town: async () => ({ ok: false, refusal: 'Unexpected' }) })

  await passSeconds(revealSeconds + holdSeconds)

  expect(skeletonBlocks()).toEqual([])
  expect(screen.getByRole('button', { name: es.townTryAgain() })).toBeDefined()
})

it.each<[string, Partial<ApiClient>]>([
  ['a read', {}],
  ['a failed read', { town: async () => ({ ok: false, refusal: 'Unexpected' }) }],
  ['the town loading', { town: () => new Promise(() => undefined) }],
])('holds one h1 on the school with %s', async (_state, overrides) => {
  await showSchool(schoolOf({}), overrides)

  expect(screen.getAllByRole('heading', { level: 1 }).map((h1) => h1.textContent)).toEqual([
    es.namesPlacesSchool(),
  ])
})

const pressStudyOf = async (town: TownOverview, number: number): Promise<ReadonlyArray<string>> => {
  const started: Array<string> = []
  await showSchool(town, {
    startLesson: async (lessonId) => {
      started.push(lessonId)
      return { ok: true, value: town }
    },
  })
  fireEvent.click(studyButtonOf(number))
  await passSeconds(0)
  return started
}

it('sends a lesson marked past the cap, since the api decides', async () => {
  const started = await pressStudyOf(
    schoolOf({
      learning: { cap: 15, inLearning: 12, retainedWords: null, nextInLearningDueAt: null },
    }),
    1,
  )

  expect(started).toEqual(['lesson-1'])
})

it('sends a lesson whose school level is marked too low, since the api decides', async () => {
  const started = await pressStudyOf(
    schoolOf({
      lessons: [lessonOf(1, { isStudied: true }), lessonOf(2, { requiredSchoolLevel: 2 })],
    }),
    2,
  )

  expect(started).toEqual(['lesson-2'])
})

it('sends a lesson while another one runs in the slot, since the api decides', async () => {
  const started = await pressStudyOf(
    schoolOf({ lessons: [lessonOf(1), lessonOf(2)], lessonSlot: lessonOneStudying }),
    2,
  )

  expect(started).toEqual(['lesson-2'])
})

const openTextOf = (number: number): TownOverview['texts'][number] => ({
  id: `text-${number}`,
  title: `Text ${number}`,
})

const textList = (): HTMLElement | null => screen.queryByRole('region', { name: es.schoolTexts() })

it('lists the open texts newest first', async () => {
  await showSchool(schoolOf({ texts: [openTextOf(3), openTextOf(2), openTextOf(1)] }))

  const titles = within(screen.getByRole('region', { name: es.schoolTexts() }))
    .getAllByRole('link')
    .map(({ textContent }) => textContent)

  expect(titles).toEqual(['Text 3', 'Text 2', 'Text 1'])
})

it('shows no text list while no text is open', async () => {
  await showSchool(schoolOf({ texts: [] }))

  expect(textList()).toBeNull()
})

it('opens a text from its row', async () => {
  const router = renderAppAt(
    '/school',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      town: async () => ({ ok: true, value: schoolOf({ texts: [openTextOf(1)] }) }),
    }),
  )
  await passSeconds(0)

  fireEvent.click(screen.getByRole('link', { name: 'Text 1' }))
  await passSeconds(0)

  expect(router.state.location.pathname).toBe('/school/texts/text-1')
})

it('shows the held words of each started band', async () => {
  await showSchool(
    schoolOf({
      bandLines: [
        { band: 1, count: 12, total: 875 },
        { band: 2, count: 0, total: 500 },
      ],
    }),
  )

  expect(screen.getByText(es.schoolBandLine({ band: 1, count: 12, total: 875 }))).toBeDefined()
  expect(screen.getByText(es.schoolBandLine({ band: 2, count: 0, total: 500 }))).toBeDefined()
})

it('shows no band line before a band starts', async () => {
  await showSchool(schoolOf({ bandLines: [] }))

  expect(screen.queryByText(/^Banda \d+: /)).toBeNull()
})

it('tells the player about the holdout once a band has started', async () => {
  await showSchool(schoolOf({ hasBandStarted: true }))

  expect(shownLinesDrawnAlone(es.schoolHoldoutNote(), 'es')).toHaveLength(1)
})

it('tells the holdout in English under no scaffold', async () => {
  await showSchool(schoolOf({ hasBandStarted: true, scaffold: 'none', chromePhase: 'english' }))

  expect(shownLinesDrawnAlone(en.schoolHoldoutNote(), 'en')).toHaveLength(1)
})

it('says nothing of the holdout before a band starts', async () => {
  await showSchool(schoolOf({ hasBandStarted: false }))

  expect(shownLinesDrawnAlone(es.schoolHoldoutNote(), 'es')).toHaveLength(0)
})

it('draws each due holdout check with a way into it', async () => {
  await showSchool(
    schoolOf({
      dueHoldoutChecks: [
        { band: 1, week: 24 },
        { band: 2, week: 8 },
      ],
    }),
  )

  const ways = within(screen.getByRole('main')).getAllByRole('link', {
    name: es.schoolHoldoutCheckOpen(),
  })
  expect(ways.map((way) => way.getAttribute('href'))).toEqual([
    '/school/check/1/24',
    '/school/check/2/8',
  ])
  expect(ways.map(accessibleDescriptionOf)).toEqual([
    es.schoolHoldoutCheckRow({ band: 1, week: 24 }),
    es.schoolHoldoutCheckRow({ band: 2, week: 8 }),
  ])
})

type ReleasedLesson = TownOverview['releasedLessons'][number]

const releasedOf = (position: number, overrides: Partial<ReleasedLesson> = {}): ReleasedLesson => ({
  id: `released-2-${position}`,
  band: 2,
  position,
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  isStudied: false,
  words: wordsOf('notStarted', 'notStarted', 'notStarted'),
  ...overrides,
})

const releasedTitleOf = (position: number): string =>
  es.schoolReleasedTitle({ band: 2, number: position })

const releasedRow = (position: number): HTMLElement =>
  screen.getByRole('listitem', { name: releasedTitleOf(position) })

const releasedStudyOf = (position: number): HTMLElement =>
  within(releasedRow(position)).getByRole('button', {
    name: `${releasedTitleOf(position)} · ${es.schoolReleasedStudy()} · 5:00`,
  })

const shelvedAndReleased = schoolOf({
  lessons: studiedThrough(0, 2),
  releasedLessons: [releasedOf(2), releasedOf(1)],
})

const releasedSetTwoStudying: TownOverview['lessonSlot'] = {
  lessonId: 'released-2-2',
  startedAt: instantAfter(-60),
  finishesAt: instantAfter(240),
}

const rowNames = (): ReadonlyArray<string | null> =>
  within(screen.getByRole('region', { name: es.schoolLessons() }))
    .getAllByRole('listitem')
    .map((row) => row.getAttribute('aria-label'))

it('draws the released lessons after the shelved ones', async () => {
  await showSchool(shelvedAndReleased)

  expect(rowNames()).toEqual(['Lección 2', releasedTitleOf(2), releasedTitleOf(1)])
})

it('draws no released row with none released', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(0, 2), releasedLessons: [] }))

  expect(rowNames()).toEqual(['Lección 2'])
})

it('starts a released lesson as a shelved one starts', async () => {
  const started: Array<string> = []
  await showSchool(shelvedAndReleased, {
    startLesson: async (lessonId) => {
      started.push(lessonId)
      return { ok: true, value: { ...shelvedAndReleased, lessonSlot: releasedSetTwoStudying } }
    },
  })

  fireEvent.click(releasedStudyOf(2))
  await passSeconds(0)

  expect(started).toEqual(['released-2-2'])
  expect(within(screen.getByRole('main')).getByRole('timer').textContent).toBe('4 min')
})

it('counts the words of a released lesson on its row', async () => {
  await showSchool(shelvedAndReleased)

  expect(within(releasedRow(1)).getByText(es.schoolLessonWords({ count: 3 }))).toBeDefined()
})

it('names a running released lesson by band and set in the slot, never as lesson 0', async () => {
  await showSchool({ ...shelvedAndReleased, lessonSlot: releasedSetTwoStudying })

  expect(
    screen.getByRole('button', { name: es.schoolReleasedStopOf({ band: 2, number: 2 }) }),
  ).toBeDefined()
  expect(screen.queryByText(/Lección 0/)).toBeNull()
})

it('marks a lesson blocked by a running released lesson with its band and set', async () => {
  await showSchool({ ...shelvedAndReleased, lessonSlot: releasedSetTwoStudying })

  expect(accessibleDescriptionOf(studyButtonOf(1))).toBe(
    es.schoolReleasedSlotBusy({ band: 2, number: 2 }),
  )
})

it('offers no words to read for a running released lesson', async () => {
  await showSchool({ ...shelvedAndReleased, lessonSlot: releasedSetTwoStudying })

  expect(screen.queryByRole('link', { name: new RegExp(es.schoolLessonReadWords()) })).toBeNull()
})

it('marks a released lesson under study as studying, with no start', async () => {
  await showSchool({ ...shelvedAndReleased, lessonSlot: releasedSetTwoStudying })

  const row = within(releasedRow(2))
  expect(row.getByText(es.schoolLessonStudying())).toBeDefined()
  expect(row.queryByRole('button')).toBeNull()
})

it('marks a studied released lesson as studied, with no start', async () => {
  await showSchool(
    schoolOf({
      lessons: studiedThrough(0, 2),
      releasedLessons: [releasedOf(1, { isStudied: true })],
    }),
  )

  const row = within(releasedRow(1))
  expect(row.getByText(es.schoolLessonStudied())).toBeDefined()
  expect(row.queryByRole('button')).toBeNull()
})

it("draws the api's refusal under the released lesson it answers", async () => {
  await showSchool(shelvedAndReleased, {
    startLesson: async () => ({
      ok: false,
      refusal: 'LearningCapReached',
      error: { kind: 'LearningCapReached', params: { learningCap: 15, cardsInLearning: 12 } },
    }),
  })

  fireEvent.click(releasedStudyOf(2))
  await passSeconds(0)

  expect(within(releasedRow(2)).getByRole('alert').textContent).toBe(
    es.refusalLearningCapReached({ learningCap: 15, cardsInLearning: 12 }),
  )
})

const releasedStep: TownOverview['nextStep'] = {
  kind: 'releasedLesson',
  lessonId: 'released-2-1',
  band: 2,
  position: 1,
}

const checkStep: TownOverview['nextStep'] = { kind: 'holdoutCheck', band: 2, week: 8 }

const releasedStepAhead = { ...shelvedAndReleased, nextStep: releasedStep }

const checkStepAhead = schoolOf({
  lessons: studiedThrough(0, 2),
  dueHoldoutChecks: [{ band: 2, week: 8 }],
  nextStep: checkStep,
})

const releasedLessonRunning = schoolOf({
  lessons: studiedThrough(2, 2),
  releasedLessons: [releasedOf(2), releasedOf(1)],
  lessonSlot: releasedSetTwoStudying,
  nextStep: { kind: 'lessonRunning', goal: null, text: null },
})

const nextStepColumn = (): HTMLElement => {
  const column = screen.getByRole('region', { name: es.townNextTitle() }).parentElement
  if (column === null) {
    throw new Error('the next-step block has no column')
  }
  return column
}

const releasedStepStudyLabel = `${releasedTitleOf(1)} · ${es.schoolReleasedStudy()} · ${formatDuration(300)}`

const lessonTitleOf = (number: number): string => es.schoolLessonTitle({ number })

it.each<[string, TownOverview]>([
  ['a released step', releasedStepAhead],
  ['a check step', checkStepAhead],
])('draws %s ahead of the shelf lesson with no lesson picked', async (_step, town) => {
  await showSchool(town)

  expect(screen.getByRole('region', { name: es.townNextTitle() })).toBeDefined()
  expect(screen.queryByRole('region', { name: es.schoolLessonTitle({ number: 1 }) })).toBeNull()
  expect(rowNames()).toContain(lessonTitleOf(1))
})

it('draws the picked shelf lesson over a released step', async () => {
  await showSchool(releasedStepAhead)

  await selectRow(1)

  expect(lessonBlock(1)).toBeDefined()
  expect(screen.queryByRole('region', { name: es.townNextTitle() })).toBeNull()
})

it("starts the released step's lesson from the block", async () => {
  const started: Array<string> = []
  await showSchool(releasedStepAhead, {
    startLesson: async (lessonId) => {
      started.push(lessonId)
      return { ok: true, value: releasedStepAhead }
    },
  })

  fireEvent.click(within(nextStepColumn()).getByRole('button', { name: releasedStepStudyLabel }))
  await passSeconds(0)

  expect(started).toEqual(['released-2-1'])
})

it('draws the released row the step names only in the block', async () => {
  await showSchool(releasedStepAhead)

  expect(rowNames()).toEqual([lessonTitleOf(1), lessonTitleOf(2), releasedTitleOf(2)])
})

it("draws the api's refusal under the released step it answers", async () => {
  await showSchool(releasedStepAhead, {
    startLesson: async () => ({
      ok: false,
      refusal: 'LearningCapReached',
      error: { kind: 'LearningCapReached', params: { learningCap: 15, cardsInLearning: 12 } },
    }),
  })

  fireEvent.click(within(nextStepColumn()).getByRole('button', { name: releasedStepStudyLabel }))
  await passSeconds(0)

  expect(within(nextStepColumn()).getByRole('alert').textContent).toBe(
    es.refusalLearningCapReached({ learningCap: 15, cardsInLearning: 12 }),
  )
})

it("opens the check step's check from the block", async () => {
  await showSchool(checkStepAhead)

  const way = within(nextStepColumn()).getByRole('link', { name: es.schoolHoldoutCheckOpen() })
  expect(way.getAttribute('href')).toBe('/school/check/2/8')
})

it('holds one ink pill on the school with a released step ahead', async () => {
  await showSchool(releasedStepAhead)

  expect(inkPills()).toEqual([releasedStepStudyLabel])
})

it.each<[string, TownOverview]>([
  ['a released step', releasedStepAhead],
  ['a check step', checkStepAhead],
  ['a released lesson running', releasedLessonRunning],
])('links the school to itself nowhere in the next step with %s', async (_step, town) => {
  await showSchool(town)

  const targets = within(nextStepColumn())
    .queryAllByRole('link')
    .map((link) => link.getAttribute('href'))
  expect(targets).not.toContain('/school')
})
