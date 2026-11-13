import {
  namesPlacesSchool,
  reportNoReviewsDue,
  reportReviewsDue,
  reportStartReviews,
  reviewNextReview,
  schoolLessonReadWords,
  schoolLessonStudy,
  schoolLessonTitle,
  schoolLessonWords,
  schoolSlotTitle,
  townNextBuildFactory,
  townNextBuildFarm,
  townNextBuildPowerStation,
  townNextGoToReport,
  townNextLessonReadyIn,
  townNextTitle,
  townSkylineBuilt,
} from '@mygame/catalog'
import type { NextStep, TownOverview } from '@mygame/contracts'
import { act, screen, within } from '@testing-library/react'
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

const secondsAfterRead = (seconds: number): string =>
  new Date(Date.parse(knownTown.readAt) + seconds * 1000).toISOString()

const lessonOf = (number: number, wordCount: number): TownOverview['lessons'][number] => ({
  id: `lesson-${number}`,
  theme: 'A day in town',
  durationSeconds: 300,
  requiredSchoolLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  isStudied: false,
  words: Array.from({ length: wordCount }, (_, index) => ({
    wordId: `word-${number}-${index}`,
    standing: 'notStarted',
    reading: null,
    support: { shown: 'beside', text: 'gloss', language: 'es' },
  })),
})

const lessons = [lessonOf(1, 5), lessonOf(2, 1)]

const runningLessonTwo: TownOverview['lessonSlot'] = {
  lessonId: 'lesson-2',
  startedAt: secondsAfterRead(-60),
  finishesAt: secondsAfterRead(240),
}

const townAt = (nextStep: NextStep, overrides: Partial<TownOverview> = {}): TownOverview => ({
  ...knownTown,
  lessons,
  nextStep,
  ...overrides,
})

const serving = (town: TownOverview, overrides: Partial<ApiClient> = {}): ApiClient =>
  stubApiClient({
    currentPlayer: async () => knownPlayer,
    town: async () => ({ ok: true, value: town }),
    ...overrides,
  })

const showTown = async (town: TownOverview, overrides: Partial<ApiClient> = {}): Promise<void> => {
  renderAppAt('/', serving(town, overrides))
  await passSeconds(0)
}

const card = (): HTMLElement => screen.getByRole('region', { name: townNextTitle() })

const controlsWithTone = (tone: string): ReadonlyArray<HTMLElement> =>
  [...screen.queryAllByRole('button'), ...screen.queryAllByRole('link')].filter(
    (control) => control.getAttribute('data-tone') === tone,
  )

const pill = (name: string): HTMLElement => {
  const [control] = controlsWithTone('primary').filter(
    (candidate) => candidate.textContent === name,
  )
  if (control === undefined) {
    throw new Error(`no ink pill named ${name}`)
  }
  return control
}

const reviewsStep = (count: number, readFirst: ReadonlyArray<string>): NextStep => ({
  kind: 'reviews',
  count,
  readFirst: [...readFirst],
})

it('opens the unread lesson first from the reviews state', async () => {
  await showTown(townAt(reviewsStep(5, ['lesson-2', 'lesson-1'])))

  const link = pill(schoolLessonReadWords())

  expect(link.getAttribute('href')).toBe('/school/lesson-2')
  expect(screen.queryByRole('link', { name: reportStartReviews() })).toBeNull()
})

it('opens the reviews when no word is unread', async () => {
  await showTown(townAt(reviewsStep(5, [])))

  expect(pill(reportStartReviews()).getAttribute('href')).toBe('/reviews')
})

it('counts the reviews due', async () => {
  await showTown(townAt(reviewsStep(3, [])))

  expect(within(card()).getByText(reportReviewsDue({ count: '3' }))).toBeDefined()
})

it('counts a single review due', async () => {
  await showTown(townAt(reviewsStep(1, [])))

  expect(within(card()).getByText(reportReviewsDue({ count: '1' }))).toBeDefined()
})

it("shows the running lesson's time beside the reviews", async () => {
  await showTown(townAt(reviewsStep(3, []), { lessonSlot: runningLessonTwo }))

  const timer = within(card()).getByRole('timer')

  expect(timer.textContent).toBe(`${townNextLessonReadyIn({ number: 2 })}4 min`)
})

it('shows no lesson time beside the reviews while no lesson runs', async () => {
  await showTown(townAt(reviewsStep(3, [])))

  expect(within(card()).queryByRole('timer')).toBeNull()
})

it('opens the words of the running lesson', async () => {
  await showTown(
    townAt({ kind: 'lessonRunning', producer: null }, { lessonSlot: runningLessonTwo }),
  )

  expect(within(card()).getByText(schoolSlotTitle())).toBeDefined()
  expect(pill(schoolLessonReadWords()).getAttribute('href')).toBe('/school/lesson-2')
})

it('opens the school if the read holds no running lesson', async () => {
  await showTown(townAt({ kind: 'lessonRunning', producer: null }))

  expect(pill(schoolLessonReadWords()).getAttribute('href')).toBe('/school')
})

it('names the producer to build', async () => {
  await showTown(
    townAt({ kind: 'lessonRunning', producer: 'farm' }, { lessonSlot: runningLessonTwo }),
  )

  expect(within(card()).getByText(townNextBuildFarm())).toBeDefined()
})

it('names the factory to build', async () => {
  await showTown(
    townAt({ kind: 'lessonRunning', producer: 'factory' }, { lessonSlot: runningLessonTwo }),
  )

  expect(within(card()).getByText(townNextBuildFactory())).toBeDefined()
})

it('names the power station to build', async () => {
  await showTown(
    townAt({ kind: 'lessonRunning', producer: 'powerStation' }, { lessonSlot: runningLessonTwo }),
  )

  expect(within(card()).getByText(townNextBuildPowerStation())).toBeDefined()
})

it('names no producer when none is to build', async () => {
  await showTown(
    townAt({ kind: 'lessonRunning', producer: null }, { lessonSlot: runningLessonTwo }),
  )

  expect(within(card()).queryByText(townNextBuildFarm())).toBeNull()
})

it("opens the school with the next review's time", async () => {
  await showTown(
    townAt({ kind: 'lessonToStudy', lessonId: 'lesson-1' }, { nextDueAt: secondsAfterRead(540) }),
  )

  expect(pill(schoolLessonStudy({ number: 1 })).getAttribute('href')).toBe('/school')
  expect(within(card()).getByRole('timer').textContent).toBe(`${reviewNextReview()}9 min`)
})

it('shows no time with no review ahead', async () => {
  await showTown(townAt({ kind: 'lessonToStudy', lessonId: 'lesson-1' }))

  expect(within(card()).queryByRole('timer')).toBeNull()
})

it('names the lesson to study with its words', async () => {
  await showTown(townAt({ kind: 'lessonToStudy', lessonId: 'lesson-1' }))

  expect(within(card()).getByText(schoolLessonTitle({ number: 1 }))).toBeDefined()
  expect(within(card()).getByText(schoolLessonWords({ count: 5 }))).toBeDefined()
})

it('reads a lesson of a single word in the singular', async () => {
  await showTown(townAt({ kind: 'lessonToStudy', lessonId: 'lesson-2' }))

  expect(within(card()).getByText('1 palabra')).toBeDefined()
})

it('opens the Report when caught up', async () => {
  await showTown(townAt({ kind: 'caughtUp', goal: null }, { nextDueAt: secondsAfterRead(540) }))

  expect(within(card()).getByText(reportNoReviewsDue())).toBeDefined()
  expect(within(card()).getByRole('timer').textContent).toBe(`${reviewNextReview()}9 min`)
  expect(pill(townNextGoToReport()).getAttribute('href')).toBe('/report')
})

it('counts the next review down between reads', async () => {
  const dueLater = townAt({ kind: 'caughtUp', goal: null }, { nextDueAt: secondsAfterRead(540) })
  await showTown(dueLater, {
    town: vi
      .fn<ApiClient['town']>()
      .mockResolvedValueOnce({ ok: true, value: dueLater })
      .mockReturnValue(new Promise(() => undefined)),
  })

  await passSeconds(120)

  expect(within(card()).getByRole('timer').textContent).toBe(`${reviewNextReview()}7 min`)
})

it('counts the last minute of the next review by the second', async () => {
  await showTown(townAt({ kind: 'caughtUp', goal: null }, { nextDueAt: secondsAfterRead(45) }))

  await passSeconds(10)

  expect(within(card()).getByRole('timer').textContent).toBe(`${reviewNextReview()}0:35`)
})

it('re-reads at nextDueAt', async () => {
  const dueSoon = townAt({ kind: 'caughtUp', goal: null }, { nextDueAt: secondsAfterRead(30) })
  const town = vi.fn<ApiClient['town']>().mockResolvedValue({ ok: true, value: dueSoon })
  await showTown(dueSoon, { town })
  await passSeconds(29)
  const readsBefore = town.mock.calls.length

  await passSeconds(1)

  expect([readsBefore, town.mock.calls.length]).toEqual([1, 2])
})

const workUnderWay: TownOverview['work'] = {
  slot: {
    building: 'farm',
    level: 1,
    cost: { money: 60, food: 40, power: 0, material: 80 },
    startsAt: secondsAfterRead(-60),
    finishesAt: secondsAfterRead(240),
  },
  waitingList: [],
  cap: 2,
}

it.each<[string, NextStep, Partial<TownOverview>, () => string]>([
  ['the reviews', reviewsStep(3, []), {}, reportStartReviews],
  ['an unread lesson', reviewsStep(3, ['lesson-1']), {}, schoolLessonReadWords],
  [
    'the reviews beside a running lesson',
    reviewsStep(3, []),
    { lessonSlot: runningLessonTwo },
    reportStartReviews,
  ],
  [
    'a running lesson',
    { kind: 'lessonRunning', producer: 'farm' },
    { lessonSlot: runningLessonTwo },
    schoolLessonReadWords,
  ],
  [
    'a lesson to study',
    { kind: 'lessonToStudy', lessonId: 'lesson-1' },
    {},
    () => schoolLessonStudy({ number: 1 }),
  ],
  ['caught up', { kind: 'caughtUp', goal: null }, {}, townNextGoToReport],
  [
    'building work under way',
    { kind: 'caughtUp', goal: null },
    { work: workUnderWay },
    townNextGoToReport,
  ],
])('holds one ink pill on the town home at %s', async (_state, step, overrides, label) => {
  await showTown(townAt(step, overrides))

  expect(controlsWithTone('primary')).toEqual([pill(label())])
})

it('holds no pill inside a block', async () => {
  await showTown(townAt(reviewsStep(3, [])))

  expect([
    ...within(card()).queryAllByRole('link'),
    ...within(card()).queryAllByRole('button'),
  ]).toEqual([])
})

it("keeps the next step's block peach", async () => {
  await showTown(townAt({ kind: 'caughtUp', goal: null }))

  expect(card().dataset.hue).toBe('peach')
})

it('puts the next step before the skyline', async () => {
  await showTown(townAt({ kind: 'caughtUp', goal: null }))

  const skyline = screen.getByRole('img', { name: townSkylineBuilt({ built: 2, total: 7 }) })

  expect(card().compareDocumentPosition(skyline)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

it('draws the school first', async () => {
  await showTown(townAt({ kind: 'caughtUp', goal: null }))

  const [firstPlace] = screen.getAllByRole('heading', { level: 4 })

  expect(firstPlace?.textContent).toContain(namesPlacesSchool())
})

it('draws the card before the places', async () => {
  await showTown(townAt({ kind: 'caughtUp', goal: null }))

  const [firstHeading] = screen.getAllByRole('heading', { level: 3 })

  expect(firstHeading?.textContent).toBe(townNextTitle())
})

it('shows the same card on a return visit, with no greeting', async () => {
  const town = townAt({ kind: 'caughtUp', goal: null }, { nextDueAt: secondsAfterRead(540) })
  await showTown(town)
  const firstVisit = card().textContent

  await passSeconds(0)

  expect(card().textContent).toBe(firstVisit)
})
