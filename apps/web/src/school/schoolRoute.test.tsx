import {
  namesPlacesSchool,
  refusalLearningCapReached,
  reportNoReviewsDue,
  reportStartReviews,
  schoolLearning,
  schoolLessonCapReached,
  schoolLessonNeedsSchool,
  schoolLessonReadWords,
  schoolLessonReward,
  schoolLessonSlotBusy,
  schoolLessonStudied,
  schoolLessonStudy,
  schoolLessonTitle,
  schoolLessonWords,
  schoolPathCount,
  schoolPathLearned,
  schoolPathRead,
  schoolPathReviewed,
  schoolPathStudied,
  schoolSkillName,
  schoolSkillRate,
  schoolSkillsNone,
  schoolSlotDone,
  schoolSlotStopOf,
  townGoToSchool,
  townLevel,
  townLoading,
  townNamingTitle,
  townNextGoToReport,
  townNextTitle,
  townTryAgain,
} from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts/town'
import type { WordStanding } from '@mygame/domain'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { accessibleDescriptionOf } from '../design-system/accessibleDescriptionOf.testSupport'
import {
  answeringOnDemand,
  holdSeconds,
  neverAnswering,
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
  screen.getByRole('region', { name: schoolLessonTitle({ number }) })

const studyLabelOf = (number: number): string => `${schoolLessonStudy({ number })} · 5:00`

const studyButtonOf = (number: number): HTMLElement =>
  screen.getByRole('button', { name: studyLabelOf(number) })

const readWordsOfLessonOne = (): string =>
  `${schoolLessonTitle({ number: 1 })} · ${schoolLessonReadWords()}`

const selectRow = async (number: number): Promise<void> => {
  fireEvent.click(within(lessonRow(number)).getByRole('button'))
  await passSeconds(0)
}

const wordsOf = (...standings: ReadonlyArray<WordStanding>): Lesson['words'] =>
  standings.map((standing, index) => ({ wordId: `word-${index + 1}`, standing, reading: null }))

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
  `${schoolPathStudied()} ${schoolPathCount({ count: studied, total })}`,
  `${schoolPathRead()} ${schoolPathCount({ count: read, total })}`,
  `${schoolPathReviewed()} ${schoolPathCount({ count: reviewed, total })}`,
  `${schoolPathLearned()} ${schoolPathCount({ count: learned, total })}`,
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

  const reward = `${schoolLessonWords({ count: 5 })} · ${schoolLessonReward({ percent: 5, resource: 'comida' })}`
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

  const pill = screen.getByRole('link', { name: schoolLessonReadWords() })
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

  expect(screen.getAllByRole('link', { name: reportStartReviews() })).toHaveLength(1)
})

it("opens the reviews from the school's link once no lesson is unread", async () => {
  const lessons = [lessonOf(1, { isStudied: true }), lessonOf(2)]
  await showSchool(schoolOf({ lessons, nextStep: { kind: 'reviews', count: 2, readFirst: [] } }))

  const link = screen.getByRole('link', { name: reportStartReviews() })
  expect(link.getAttribute('href')).toBe('/reviews')
})

it('shows no link to the reviews when none is due', async () => {
  const lessons = [lessonOf(1, { isStudied: true }), lessonOf(2)]
  await showSchool(schoolOf({ lessons, nextStep: { kind: 'lessonToStudy', lessonId: 'lesson-2' } }))

  expect(screen.queryByRole('link', { name: reportStartReviews() })).toBeNull()
  expect(screen.queryByRole('link', { name: schoolLessonReadWords() })).toBeNull()
})

it('opens the school from the town home', async () => {
  await showSchool(schoolOf({}), {}, '/')

  fireEvent.click(screen.getByRole('link', { name: townGoToSchool() }))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 1, name: namesPlacesSchool() })).toBeDefined()
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

  const readWords = screen.getByRole('link', { name: schoolLessonReadWords() })

  expect(readWords.getAttribute('href')).toBe('/school/lesson-1')
})

it("opens the running lesson's words from under another lesson's block", async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(0, 2), lessonSlot: lessonOneStudying }))

  const readWords = screen.getByRole('link', { name: readWordsOfLessonOne() })

  expect(readWords.getAttribute('href')).toBe('/school/lesson-1')
})

it('offers no words to read while no lesson runs', async () => {
  await showSchool(schoolOf({}))

  expect(screen.queryByRole('link', { name: schoolLessonReadWords() })).toBeNull()
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
  expect(screen.getByText(schoolSlotDone())).toBeDefined()

  await act(async () => answerFinishRead({ ok: true, value: studied }))
  expect(within(lessonRow(1)).getByText(schoolLessonStudied())).toBeDefined()
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

  const stop = screen.getByRole('button', { name: schoolSlotStopOf({ number: 1 }) })
  act(() => {
    fireEvent.click(stop)
    fireEvent.click(stop)
  })
  await act(async () => answer({ ok: true, value: schoolOf({}) }))

  expect(stopLesson).toHaveBeenCalledTimes(1)
})

it('blocks a lesson whose school level is too low and names the level', async () => {
  await showSchool(
    schoolOf({
      lessons: [lessonOf(1, { isStudied: true }), lessonOf(2, { requiredSchoolLevel: 2 })],
    }),
  )

  const study = studyButtonOf(2)
  expect(study.getAttribute('aria-disabled')).toBe('true')
  expect(accessibleDescriptionOf(study)).toBe(schoolLessonNeedsSchool({ level: 2 }))
})

it('marks a lesson past the cap before the tap with the words in learning', async () => {
  await showSchool(schoolOf({ learning: { cap: 15, inLearning: 12, retainedWords: null } }))

  expect(screen.getByText(schoolLearning({ inLearning: 12, cap: 15 }))).toBeDefined()
  expect(accessibleDescriptionOf(studyButtonOf(1))).toBe(
    schoolLessonCapReached({ inLearning: 12, cap: 15, count: 5 }),
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
    refusalLearningCapReached({ learningCap: 15, cardsInLearning: 12 }),
  )
})

it('marks a studied lesson with no study button', async () => {
  await showSchool(schoolOf({ lessons: [lessonOf(1, { isStudied: true })] }))

  expect(within(lessonRow(1)).getByText(schoolLessonStudied())).toBeDefined()
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
    `${schoolSkillName({ resource: 'comida', level: 1 })}${schoolSkillRate({ percent: 5, resource: 'comida' })}`,
    `${schoolSkillName({ resource: 'material', level: 1 })}${schoolSkillRate({ percent: 5, resource: 'material' })}`,
    `${schoolSkillName({ resource: 'comida', level: 2 })}${schoolSkillRate({ percent: 5, resource: 'comida' })}`,
  ])
})

it('says so when no skill is earned', async () => {
  await showSchool(schoolOf({}))

  expect(screen.getByText(schoolSkillsNone())).toBeDefined()
})

it('sends a player with no town to name one', async () => {
  await showSchool(schoolOf({}), {
    town: async () => ({ ok: false, refusal: 'TownNotFound' }),
  })

  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 2, name: townNamingTitle() })).toBeDefined()
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

  expect(screen.getByRole('status').textContent).toBe(townLoading())
})

it('retries a failed read of the school', async () => {
  let reads = 0
  await showSchool(schoolOf({}), {
    town: async () => {
      reads += 1
      return reads === 1 ? { ok: false, refusal: 'Unexpected' } : { ok: true, value: schoolOf({}) }
    },
  })

  fireEvent.click(screen.getByRole('button', { name: townTryAgain() }))
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

  const load = screen.getByText(schoolLearning({ inLearning: 0, cap: 15 }))
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
    screen.getByRole('heading', { name: schoolLessonTitle({ number: 3 }) }),
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
  expect(inkPills()).toEqual([schoolLessonReadWords()])
})

it('offers no selection on a studied lesson', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(1, 2) }))

  expect(within(lessonRow(1)).queryByRole('button')).toBeNull()
})

it('selects the running lesson from its row, with its words as the one pill', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(0, 2), lessonSlot: lessonOneStudying }))

  await selectRow(1)

  expect(lessonBlock(1)).toBeDefined()
  expect(inkPills()).toEqual([schoolLessonReadWords()])
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

  expect(accessibleDescriptionOf(studyButtonOf(2))).toBe(schoolLessonSlotBusy({ number: 1 }))
})

it('draws the running lesson in the block when no other lesson is open', async () => {
  await showSchool(schoolOf({ lessonSlot: lessonOneStudying }))

  expect(within(lessonBlock(1)).getByText('Theme 1')).toBeDefined()
})

it('draws the next step in the block once every lesson is studied', async () => {
  await showSchool(schoolOf({ lessons: studiedThrough(2, 2) }))

  const block = screen.getByRole('region', { name: townNextTitle() })
  expect(block.getAttribute('data-hue')).toBe('peach')
  expect(within(block).getByText(reportNoReviewsDue())).toBeDefined()
  expect(within(block).getByRole('heading', { level: 2, name: townNextTitle() })).toBeDefined()
})

const everyLessonStudied = { lessons: studiedThrough(2, 2) }

it.each<[string, Partial<TownOverview>, () => string]>([
  ['no lesson studied', {}, () => studyLabelOf(1)],
  [
    'a lesson running with another open',
    { lessons: studiedThrough(0, 2), lessonSlot: lessonOneStudying },
    readWordsOfLessonOne,
  ],
  ['the last lesson running', { lessonSlot: lessonOneStudying }, schoolLessonReadWords],
  [
    "the next lesson locked by the school's level",
    { lessons: [lessonOf(1, { requiredSchoolLevel: 9 })] },
    () => studyLabelOf(1),
  ],
  [
    'the next lesson locked by the cap',
    { learning: { cap: 15, inLearning: 12, retainedWords: null } },
    () => studyLabelOf(1),
  ],
  ['every lesson studied, nothing due', everyLessonStudied, townNextGoToReport],
  [
    'every lesson studied, reviews due',
    { ...everyLessonStudied, nextStep: { kind: 'reviews', count: 2, readFirst: [] } },
    reportStartReviews,
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

  expect(inkPills()).toEqual([townTryAgain()])
})

const schoolLevelLine = (): HTMLElement | null =>
  screen.queryByText(townLevel({ level: knownTown.buildings.school.level }))

const townNeverAnswering: Partial<ApiClient> = { town: neverAnswering }

it('keeps the loading line in a status region while the school loads', async () => {
  await showSchool(schoolOf({}), townNeverAnswering)

  expect(screen.getByRole('status').textContent).toBe(townLoading())
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

  expect(screen.getByRole('heading', { level: 1, name: namesPlacesSchool() })).toBeDefined()
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
  expect(screen.getByRole('button', { name: townTryAgain() })).toBeDefined()
})

it.each<[string, Partial<ApiClient>]>([
  ['a read', {}],
  ['a failed read', { town: async () => ({ ok: false, refusal: 'Unexpected' }) }],
  ['the town loading', { town: () => new Promise(() => undefined) }],
])('holds one h1 on the school with %s', async (_state, overrides) => {
  await showSchool(schoolOf({}), overrides)

  expect(screen.getAllByRole('heading', { level: 1 }).map((h1) => h1.textContent)).toEqual([
    namesPlacesSchool(),
  ])
})
