import {
  namesPlacesSchool,
  refusalLearningCapReached,
  schoolLearning,
  schoolLessonCapReached,
  schoolLessonNeedsSchool,
  schoolLessonStudied,
  schoolLessonStudy,
  schoolSkillName,
  schoolSkillRate,
  schoolSkillsNone,
  schoolSlotDone,
  schoolSlotStopOf,
  townGoToSchool,
  townLoading,
  townNamingTitle,
  townTryAgain,
} from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts/town'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { accessibleDescriptionOf } from '../design-system/accessibleDescriptionOf.testSupport'

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

const lessonCard = (number: number): HTMLElement =>
  screen.getByRole('listitem', { name: `Lección ${number}` })

const studyButtonOf = (number: number): HTMLElement =>
  within(lessonCard(number)).getByRole('button', {
    name: `${schoolLessonStudy({ number })} · 5:00`,
  })

it('opens the school from the town home', async () => {
  await showSchool(schoolOf({}), {}, '/')

  fireEvent.click(screen.getByRole('link', { name: townGoToSchool() }))
  await passSeconds(0)

  expect(screen.getByRole('heading', { level: 2, name: namesPlacesSchool() })).toBeDefined()
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
  expect(screen.getByRole('timer').textContent).toBe('4 min')
})

it('shows a running lesson’s countdown', async () => {
  const studying = schoolOf({ lessonSlot: lessonOneStudying })
  await showSchool(studying, {
    town: async () => ({
      ok: true,
      value: { ...studying, readAt: new Date(Date.now()).toISOString() },
    }),
  })

  expect(screen.getByRole('timer').textContent).toBe('4 min')

  await passSeconds(190)

  expect(screen.getByRole('timer').textContent).toBe('0:50')
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
  expect(within(lessonCard(1)).getByText(schoolLessonStudied())).toBeDefined()
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
  await showSchool(schoolOf({ learning: { cap: 15, inLearning: 12 } }))

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

  expect(within(lessonCard(1)).getByRole('alert').textContent).toBe(
    refusalLearningCapReached({ learningCap: 15, cardsInLearning: 12 }),
  )
})

it('marks a studied lesson with no study button', async () => {
  await showSchool(schoolOf({ lessons: [lessonOf(1, { isStudied: true })] }))

  expect(within(lessonCard(1)).getByText(schoolLessonStudied())).toBeDefined()
  expect(within(lessonCard(1)).queryByRole('button')).toBeNull()
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

  expect(lessonCard(1)).toBeDefined()
})
