import { assert, describe, expect, it } from 'vitest'
import type { HoldoutCheck } from '../../holdout/HoldoutCheck'
import type { ReleasedLesson } from '../../holdout/ReleasedLesson'
import type { BandStart } from '../../learning/curriculum/BandStart'
import { inMemoryBands } from '../../learning/curriculum/testing/inMemoryBands'
import { lessonOne } from '../../learning/curriculum/testing/lessonOne'
import { unitLessonOne } from '../../learning/curriculum/testing/unitLessonOne'
import type { Text } from '../../learning/frames/Text'
import type { HeldCard } from '../../learning/HeldCard'
import type { Lesson } from '../../learning/Lesson'
import { MemoryCard } from '../../memory/MemoryCard'
import { defaultMemoryTerms } from '../../memory/MemoryTerms'
import { reviewMemoryCard } from '../../memory/reviewMemoryCard'
import { placedOutBandsOf } from '../../placement/placedOutBandsOf'
import { placementScoresOf } from '../../placement/placementScoresOf'
import { plainTownSettings, townCatalogOf } from '../../testing/townCatalogOf'
import { type TownShape, townOf } from '../../testing/townFixtures'
import { Instant } from '../../time/Instant'
import type { WorkSlot } from '../BuildingWork'
import type { LessonSlot } from '../LessonSlot'
import type { ResourceKind } from '../ResourceKind'
import { type NextStepReading, nextStepOf } from './nextStepOf'

const readAt = Instant.fromEpochMilliseconds(
  plainTownSettings.seasons.epoch.epochMilliseconds + 3_600_000,
)
const enteredAt = Instant.fromEpochMilliseconds(readAt.epochMilliseconds - 60_000)
const finishesAt = Instant.fromEpochMilliseconds(readAt.epochMilliseconds + 240_000)

const catalog = townCatalogOf()

const lessonNumbered = (
  number: number,
  overrides: Partial<Pick<Lesson, 'requiredSchoolLevel' | 'skill'>> = {},
): Lesson => ({
  ...lessonOne,
  id: `lesson-${number}`,
  words: lessonOne.words.map((word) => ({ ...word, id: `${word.id}-${number}` })),
  ...overrides,
})

const skillOn = (resource: ResourceKind): Lesson['skill'] => ({ resource, ratePercent: 5 })

const curriculum = [lessonNumbered(1), lessonNumbered(2), lessonNumbered(3), lessonNumbered(4)]

const bandsOfCurriculum = inMemoryBands([
  { band: 1, lessonIds: ['lesson-2', 'lesson-3'], words: [] },
  { band: 2, lessonIds: ['lesson-4'], words: [] },
])

const runningLessonOne: LessonSlot = {
  kind: 'busy',
  lessonId: 'lesson-1',
  startedAt: enteredAt,
  finishesAt,
}

const MILLISECONDS_PER_WEEK = 7 * 24 * 3_600_000

const bandStartOf = (
  heldOutWords: ReadonlyArray<string>,
  { weeksAgo = 1, checks = [] }: { weeksAgo?: number; checks?: ReadonlyArray<HoldoutCheck> } = {},
): BandStart => ({
  band: 1,
  startedAt: Instant.fromEpochMilliseconds(
    readAt.epochMilliseconds - weeksAgo * MILLISECONDS_PER_WEEK,
  ),
  heldOutWords,
  checks,
})

const releasedLessonOf = (
  position: number,
  overrides: Partial<Pick<ReleasedLesson, 'requiredSchoolLevel'>> = {},
): ReleasedLesson => {
  const { skill: _, ...shelved } = lessonNumbered(10 + position)
  return { ...shelved, id: `released-1-${position}`, band: 1, position, ...overrides }
}

const unreviewedCardsOf = ({ words }: Lesson): ReadonlyArray<HeldCard> =>
  words.map(({ id }) => ({ wordId: id, card: MemoryCard.entered(enteredAt) }))

const waitingCardsOf = (lesson: Lesson): ReadonlyArray<HeldCard> =>
  unreviewedCardsOf(lesson).map(({ wordId, card }) => {
    const reviewed = reviewMemoryCard(card, 'good', readAt, defaultMemoryTerms)
    assert(reviewed.ok)
    return { wordId, card: reviewed.value }
  })

const readingOf = (
  overrides: Partial<Omit<NextStepReading, 'town'>> & { readonly town?: Partial<TownShape> } = {},
): NextStepReading => ({
  lessonSlot: { kind: 'idle' },
  cards: [],
  bandStarts: [],
  released: [],
  placedOutBands: [],
  at: readAt,
  ...overrides,
  town: townOf({ storedAt: readAt, ...overrides.town }),
})

const textFrom = (fromLessonId: string): Text => ({
  id: `text-of-${fromLessonId}`,
  fromLessonId,
  title: `The Story of ${fromLessonId}`,
  sentences: ['I live in a little old house.'],
})

const curriculumTexts = [textFrom('lesson-1'), textFrom('lesson-3'), textFrom('lesson-4')]

const stepOf = (
  reading: NextStepReading,
  lessons: ReadonlyArray<Lesson> = curriculum,
  texts: ReadonlyArray<Text> = [],
): ReturnType<typeof nextStepOf> =>
  nextStepOf(reading, {
    lessons,
    texts,
    bands: bandsOfCurriculum,
    memoryTerms: defaultMemoryTerms,
    catalog,
  })

const answered = (
  reading: NextStepReading,
  lessons?: ReadonlyArray<Lesson>,
  texts?: ReadonlyArray<Text>,
): unknown => {
  const step = stepOf(reading, lessons, texts)
  assert(step.ok)
  return step.value
}

const farmUnderWork: WorkSlot = {
  kind: 'busy',
  building: 'farm',
  level: 1,
  cost: { money: 0, food: 0, power: 0, material: 0 },
  startedAt: enteredAt,
  finishesAt,
}

describe('nextStepOf', () => {
  it('answers reviews over a running lesson', () => {
    const reading = readingOf({
      cards: unreviewedCardsOf(lessonNumbered(2)),
      lessonSlot: runningLessonOne,
    })

    expect(answered(reading)).toEqual({ kind: 'reviews', count: 5, readFirst: ['lesson-2'] })
  })

  it('answers reviews for a single due card', () => {
    const [onlyDue] = unreviewedCardsOf(lessonNumbered(1))
    assert(onlyDue !== undefined)

    expect(answered(readingOf({ cards: [onlyDue] }))).toEqual({
      kind: 'reviews',
      count: 1,
      readFirst: ['lesson-1'],
    })
  })

  it('refuses a card on a step the memory terms lack', () => {
    const step = nextStepOf(readingOf({ cards: waitingCardsOf(lessonNumbered(1)) }), {
      lessons: curriculum,
      texts: [],
      bands: bandsOfCurriculum,
      memoryTerms: { ...defaultMemoryTerms, learningStepsSeconds: [] },
      catalog,
    })

    expect(step).toMatchObject({ ok: false, error: { kind: 'UnknownMemoryStep' } })
  })

  it('reads no lesson first once every due word was reviewed', () => {
    const dueAgain = waitingCardsOf(lessonNumbered(1))
    const nextDay = Instant.fromEpochMilliseconds(readAt.epochMilliseconds + 86_400_000)

    expect(answered(readingOf({ cards: dueAgain, at: nextDay }))).toEqual({
      kind: 'reviews',
      count: 5,
      readFirst: [],
    })
  })

  it('answers lessonRunning while the slot is busy and no card is due', () => {
    const reading = readingOf({
      cards: waitingCardsOf(lessonNumbered(2)),
      lessonSlot: runningLessonOne,
      town: { buildingLevels: { farm: 1 } },
    })

    expect(answered(reading)).toEqual({ kind: 'lessonRunning', text: null })
  })

  it('answers the first unstudied lesson the school and the cap admit', () => {
    const studied = lessonNumbered(1)
    const lessons = [
      studied,
      lessonNumbered(2, { requiredSchoolLevel: 2 }),
      lessonNumbered(3),
      lessonNumbered(4),
    ]
    const reading = readingOf({ cards: waitingCardsOf(studied) })

    expect(answered(reading, lessons)).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-3' })
  })

  it('steps past the lessons of a placed-out band to the first lesson of the band failed', () => {
    const reading = readingOf({
      cards: waitingCardsOf(lessonNumbered(1)),
      placedOutBands: [1],
    })

    expect(answered(reading)).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-4' })
  })

  it('offers a placed player a unit lesson before the first band failed', () => {
    const lessons = [
      lessonNumbered(1),
      lessonNumbered(2),
      lessonNumbered(3),
      unitLessonOne,
      lessonNumbered(4),
    ]
    const reading = readingOf({
      cards: waitingCardsOf(lessonNumbered(1)),
      placedOutBands: [1],
    })

    expect(answered(reading, lessons)).toEqual({
      kind: 'lessonToStudy',
      lessonId: 'unit-lesson-1',
    })
  })

  it('keeps an unstudied chrome lesson first for a placed player', () => {
    expect(answered(readingOf({ placedOutBands: [1, 2] }))).toEqual({
      kind: 'lessonToStudy',
      lessonId: 'lesson-1',
    })
  })

  it('starts a skipped player at lesson 1', () => {
    const skipped = placedOutBandsOf(placementScoresOf({ kind: 'skipped', skippedAt: readAt }))

    expect(answered(readingOf({ placedOutBands: skipped }))).toEqual({
      kind: 'lessonToStudy',
      lessonId: 'lesson-1',
    })
  })

  it('counts only the words entering against the cap', () => {
    const reading = readingOf({
      cards: curriculum.slice(0, 3).flatMap(waitingCardsOf).slice(1),
      bandStarts: [bandStartOf(['home', 'school', 'work', 'money'])],
    })

    expect(answered(reading)).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-4' })
  })

  it('names a due check after the due reviews', () => {
    const reading = readingOf({
      cards: unreviewedCardsOf(lessonNumbered(2)),
      bandStarts: [bandStartOf([], { weeksAgo: 8 })],
    })

    expect(answered(reading)).toEqual({ kind: 'reviews', count: 5, readFirst: ['lesson-2'] })
  })

  it('names a due check before a lesson', () => {
    const reading = readingOf({ bandStarts: [bandStartOf([], { weeksAgo: 8 })] })

    expect(answered(reading)).toEqual({ kind: 'holdoutCheck', band: 1, week: 8 })
  })

  it('names a due check over a running lesson', () => {
    const reading = readingOf({
      lessonSlot: runningLessonOne,
      bandStarts: [bandStartOf([], { weeksAgo: 24 })],
    })

    expect(answered(reading)).toEqual({ kind: 'holdoutCheck', band: 1, week: 24 })
  })

  it('names a begun check that is still due', () => {
    const begun: HoldoutCheck = {
      kind: 'begun',
      week: 8,
      begunAt: readAt,
      sample: { wordIds: [], heldOutWordIds: [] },
    }
    const reading = readingOf({ bandStarts: [bandStartOf([], { weeksAgo: 8, checks: [begun] })] })

    expect(answered(reading)).toEqual({ kind: 'holdoutCheck', band: 1, week: 8 })
  })

  it('names no check once it is skipped', () => {
    const skipped: HoldoutCheck = { kind: 'skipped', week: 8, skippedAt: readAt }
    const reading = readingOf({
      bandStarts: [bandStartOf([], { weeksAgo: 8, checks: [skipped] })],
    })

    expect(answered(reading)).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-1' })
  })

  it('names an admitted released lesson before the next shelved lesson', () => {
    const reading = readingOf({ released: [releasedLessonOf(1), releasedLessonOf(2)] })

    expect(answered(reading)).toEqual({
      kind: 'releasedLesson',
      lessonId: 'released-1-1',
      band: 1,
      position: 1,
    })
  })

  it('steps past a released lesson already studied', () => {
    const studied = releasedLessonOf(1)
    const reading = readingOf({
      cards: waitingCardsOf({ ...studied, skill: skillOn('money') }),
      released: [studied, releasedLessonOf(2)],
    })

    expect(answered(reading)).toEqual({
      kind: 'releasedLesson',
      lessonId: 'released-1-2',
      band: 1,
      position: 2,
    })
  })

  it('never names a released lesson the school level refuses', () => {
    const reading = readingOf({ released: [releasedLessonOf(1, { requiredSchoolLevel: 2 })] })

    expect(answered(reading)).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-1' })
  })

  it('answers lessonRunning over an admitted released lesson', () => {
    const reading = readingOf({
      lessonSlot: runningLessonOne,
      released: [releasedLessonOf(1)],
      town: { buildingLevels: { farm: 1 } },
    })

    expect(answered(reading)).toEqual({ kind: 'lessonRunning', text: null })
  })

  it('answers caughtUp with learningCap when the cap is full', () => {
    const reading = readingOf({ cards: curriculum.slice(0, 3).flatMap(waitingCardsOf) })

    expect(answered(reading)).toEqual({ kind: 'caughtUp', reason: 'learningCap', text: null })
  })

  it('answers caughtUp with learningCap at a full cap while a school raise is under way', () => {
    const reading = readingOf({
      cards: curriculum.slice(0, 3).flatMap(waitingCardsOf),
      town: { workSlot: { ...farmUnderWork, building: 'school', level: 2 } },
    })

    expect(answered(reading)).toEqual({ kind: 'caughtUp', reason: 'learningCap', text: null })
  })

  it("answers caughtUp with schoolTooLow when the school's level is too low", () => {
    const lessons = [lessonNumbered(1, { requiredSchoolLevel: 2 })]

    expect(answered(readingOf(), lessons)).toEqual({
      kind: 'caughtUp',
      reason: 'schoolTooLow',
      text: null,
    })
  })

  it('answers caughtUp with lessonsDone when every lesson is studied', () => {
    const studied = lessonNumbered(1)

    expect(answered(readingOf({ cards: waitingCardsOf(studied) }), [studied])).toEqual({
      kind: 'caughtUp',
      reason: 'lessonsDone',
      text: null,
    })
  })

  it('takes the reason from the first unstudied shelved lesson', () => {
    const lessons = [
      ...curriculum.slice(0, 3),
      lessonNumbered(4, { requiredSchoolLevel: 2 }),
      lessonNumbered(5),
    ]
    const reading = readingOf({ cards: curriculum.slice(0, 3).flatMap(waitingCardsOf) })

    expect(answered(reading, lessons)).toEqual({
      kind: 'caughtUp',
      reason: 'schoolTooLow',
      text: null,
    })
  })

  it('takes the reason from a refused released lesson before the shelf', () => {
    const reading = readingOf({
      cards: curriculum.slice(0, 3).flatMap(waitingCardsOf),
      released: [releasedLessonOf(1, { requiredSchoolLevel: 2 })],
    })

    expect(answered(reading)).toEqual({ kind: 'caughtUp', reason: 'schoolTooLow', text: null })
  })

  it('answers schoolTooLow for a lesson past a full cap with the school too low', () => {
    const lessons = [lessonNumbered(4, { requiredSchoolLevel: 2 })]
    const reading = readingOf({ cards: curriculum.slice(0, 3).flatMap(waitingCardsOf) })

    expect(answered(reading, lessons)).toEqual({
      kind: 'caughtUp',
      reason: 'schoolTooLow',
      text: null,
    })
  })

  it('carries the newest open text on caught up', () => {
    const reading = readingOf({ cards: curriculum.slice(0, 3).flatMap(waitingCardsOf) })

    expect(answered(reading, curriculum, curriculumTexts)).toEqual({
      kind: 'caughtUp',
      reason: 'learningCap',
      text: { id: 'text-of-lesson-3', title: 'The Story of lesson-3' },
    })
  })

  it('carries it on a running lesson', () => {
    const reading = readingOf({
      cards: waitingCardsOf(lessonNumbered(1)),
      lessonSlot: { ...runningLessonOne, lessonId: 'lesson-2' },
    })

    expect(answered(reading, curriculum, curriculumTexts)).toEqual({
      kind: 'lessonRunning',
      text: { id: 'text-of-lesson-1', title: 'The Story of lesson-1' },
    })
  })

  it('carries no text before one opens', () => {
    const lessons = [lessonNumbered(1, { requiredSchoolLevel: 2 })]

    expect(answered(readingOf(), lessons, curriculumTexts)).toEqual({
      kind: 'caughtUp',
      reason: 'schoolTooLow',
      text: null,
    })
  })

  it('refuses a school level the catalog lacks', () => {
    const reading = readingOf({ town: { buildingLevels: { school: 99 } } })

    expect(stepOf(reading)).toEqual({
      ok: false,
      error: { kind: 'UnknownTownBuildingLevel', building: 'school', level: 99 },
    })
  })
})
