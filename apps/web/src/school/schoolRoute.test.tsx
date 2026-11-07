import {
  namesPlacesSchool,
  refusalLearningCapReached,
  reportNoReviewsDue,
  reportStartReviews,
  schoolLearning,
  schoolLessonCapReached,
  schoolLessonNeedsSchool,
  schoolLessonReadWords,
  schoolLessonSlotBusy,
  schoolLessonStudied,
  schoolLessonStudy,
  schoolLessonTitle,
  schoolSkillName,
  schoolSkillRate,
  schoolSkillsNone,
  schoolSlotDone,
  schoolSlotStopOf,
  townGoToSchool,
  townLoading,
  townNamingTitle,
  townNextGoToReport,
  townNextTitle,
  townTryAgain,
} from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts/town'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { accessibleDescriptionOf } from '../design-system/accessibleDescriptionOf.testSupport'
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

const isBefore = (earlier: Element, later: Element): boolean =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

const studiedThrough = (studied: number, count: number): Array<Lesson> =>
  Array.from({ length: count }, (_, index) => lessonOf(index + 1, { isStudied: index < studied }))

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
