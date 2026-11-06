import { assert, describe, expect, it } from 'vitest'
import type { HeldCard } from '../learning/HeldCard'
import type { Lesson } from '../learning/Lesson'
import { MemoryCard } from '../memory/MemoryCard'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import { lessonOne } from '../testing/lessonOne'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { type TownShape, townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { WorkSlot } from './BuildingWork'
import type { LessonSlot } from './LessonSlot'
import { type NextStepReading, nextStepOf } from './nextStepOf'
import type { ResourceKind } from './ResourceKind'
import type { TownCatalog } from './TownCatalog'

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

const runningLessonOne: LessonSlot = {
  kind: 'busy',
  lessonId: 'lesson-1',
  startedAt: enteredAt,
  finishesAt,
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
  heldOutWords: [],
  at: readAt,
  ...overrides,
  town: townOf({ storedAt: readAt, ...overrides.town }),
})

const stepOf = (
  reading: NextStepReading,
  lessons: ReadonlyArray<Lesson> = curriculum,
  townCatalog: TownCatalog = catalog,
): ReturnType<typeof nextStepOf> =>
  nextStepOf(reading, { lessons, memoryTerms: defaultMemoryTerms, catalog: townCatalog })

const answered = (reading: NextStepReading, lessons?: ReadonlyArray<Lesson>): unknown => {
  const step = stepOf(reading, lessons)
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

    expect(answered(reading)).toEqual({ kind: 'lessonRunning', producer: null })
  })

  it('names the farm while a food lesson runs and the farm stands at 0', () => {
    expect(answered(readingOf({ lessonSlot: runningLessonOne }))).toEqual({
      kind: 'lessonRunning',
      producer: 'farm',
    })
  })

  it('names the factory while a material lesson runs and the factory stands at 0', () => {
    const lessons = [lessonNumbered(1, { skill: skillOn('material') })]

    expect(answered(readingOf({ lessonSlot: runningLessonOne }), lessons)).toEqual({
      kind: 'lessonRunning',
      producer: 'factory',
    })
  })

  it('names the power station while a power lesson runs and the station stands at 0', () => {
    const lessons = [lessonNumbered(1, { skill: skillOn('power') })]

    expect(answered(readingOf({ lessonSlot: runningLessonOne }), lessons)).toEqual({
      kind: 'lessonRunning',
      producer: 'powerStation',
    })
  })

  it('names no producer once work is raising it', () => {
    const reading = readingOf({
      lessonSlot: runningLessonOne,
      town: { workSlot: farmUnderWork },
    })

    expect(answered(reading)).toEqual({ kind: 'lessonRunning', producer: null })
  })

  it('names no producer once the waiting list is raising it', () => {
    const reading = readingOf({
      lessonSlot: runningLessonOne,
      town: {
        workSlot: { ...farmUnderWork, building: 'storage', level: 2 },
        waitingList: [
          {
            building: 'farm',
            level: 1,
            cost: { money: 0, food: 0, power: 0, material: 0 },
            durationSeconds: 60,
          },
        ],
      },
    })

    expect(answered(reading)).toEqual({ kind: 'lessonRunning', producer: null })
  })

  it('names no producer for a money lesson', () => {
    const lessons = [lessonNumbered(1, { skill: skillOn('money') })]

    expect(answered(readingOf({ lessonSlot: runningLessonOne }), lessons)).toEqual({
      kind: 'lessonRunning',
      producer: null,
    })
  })

  it('names no producer for a running lesson the curriculum lacks', () => {
    const reading = readingOf({ lessonSlot: runningLessonOne })

    expect(answered(reading, [lessonNumbered(2)])).toEqual({
      kind: 'lessonRunning',
      producer: null,
    })
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

  it('counts only the words entering against the cap', () => {
    const reading = readingOf({
      cards: curriculum.slice(0, 3).flatMap(waitingCardsOf).slice(1),
      heldOutWords: ['home', 'school', 'work', 'money'],
    })

    expect(answered(reading)).toEqual({ kind: 'lessonToStudy', lessonId: 'lesson-4' })
  })

  it('answers caughtUp when the cap is full', () => {
    const reading = readingOf({ cards: curriculum.slice(0, 3).flatMap(waitingCardsOf) })

    expect(answered(reading)).toEqual({ kind: 'caughtUp' })
  })

  it('answers caughtUp at a full cap while a school raise is under way', () => {
    const reading = readingOf({
      cards: curriculum.slice(0, 3).flatMap(waitingCardsOf),
      town: { workSlot: { ...farmUnderWork, building: 'school', level: 2 } },
    })

    expect(answered(reading)).toEqual({ kind: 'caughtUp' })
  })

  it("answers caughtUp when the school's level is too low", () => {
    const lessons = [lessonNumbered(1, { requiredSchoolLevel: 2 })]

    expect(answered(readingOf(), lessons)).toEqual({ kind: 'caughtUp' })
  })

  it('answers caughtUp when the lessons are done', () => {
    const studied = lessonNumbered(1)

    expect(answered(readingOf({ cards: waitingCardsOf(studied) }), [studied])).toEqual({
      kind: 'caughtUp',
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
