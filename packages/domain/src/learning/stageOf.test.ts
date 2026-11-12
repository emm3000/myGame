import { describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import { inMemoryBands } from '../testing/inMemoryBands'
import { lessonOne } from '../testing/lessonOne'
import { unitLessonOne } from '../testing/unitLessonOne'
import { Instant } from '../time/Instant'
import type { Band } from './BandStart'
import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'
import { stageOf } from './stageOf'

const enteredAt = Instant.fromEpochMilliseconds(1_794_301_200_000)

const lessonNumbered = (number: number): Lesson => ({
  ...lessonOne,
  id: `lesson-${number}`,
  words: lessonOne.words.map((word) => ({ ...word, id: `${word.id}-${number}` })),
})

const chromeLesson = lessonNumbered(1)
const firstBandOneLesson = lessonNumbered(2)
const secondBandOneLesson = lessonNumbered(3)
const bandTwoLesson = lessonNumbered(4)

const curriculum = [
  chromeLesson,
  firstBandOneLesson,
  unitLessonOne,
  secondBandOneLesson,
  bandTwoLesson,
]

const bands = inMemoryBands([
  { band: 1, lessonIds: ['lesson-2', 'lesson-3'], words: [] },
  { band: 2, lessonIds: ['lesson-4'], words: [] },
])

const cardsOf = (...studied: ReadonlyArray<Lesson>): ReadonlyArray<HeldCard> =>
  studied.flatMap(({ words }) =>
    words.map(({ id }) => ({ wordId: id, card: MemoryCard.entered(enteredAt) })),
  )

const stageAfter = (
  cards: ReadonlyArray<HeldCard>,
  placedOutBands: ReadonlyArray<Band> = [],
): ReturnType<typeof stageOf> => stageOf(curriculum, cards, placedOutBands, bands)

describe('stageOf', () => {
  it('reaches no lesson before the first one is studied', () => {
    expect(stageAfter([])).toEqual([])
  })

  it('reaches the lessons studied from the first, in curriculum order', () => {
    expect(stageAfter(cardsOf(firstBandOneLesson, chromeLesson))).toEqual(['lesson-1', 'lesson-2'])
  })

  it('stops before the first lesson neither studied nor placed out of', () => {
    expect(stageAfter(cardsOf(chromeLesson, secondBandOneLesson, unitLessonOne))).toEqual([
      'lesson-1',
    ])
  })

  it('reaches the lessons of a placed-out band without their cards', () => {
    expect(stageAfter(cardsOf(chromeLesson), [1])).toEqual(['lesson-1', 'lesson-2', 'lesson-3'])
  })

  it('stops at an unstudied chrome lesson, which no band places out', () => {
    expect(stageAfter([], [1, 2])).toEqual([])
  })

  it('an unstudied unit lesson does not cut the stage', () => {
    const studied = cardsOf(chromeLesson, firstBandOneLesson, secondBandOneLesson)

    expect(stageAfter(studied)).toEqual(['lesson-1', 'lesson-2', 'lesson-3'])
  })

  it('leaves a studied unit lesson out of the stage', () => {
    const studied = cardsOf(chromeLesson, firstBandOneLesson, unitLessonOne)

    expect(stageAfter(studied)).toEqual(['lesson-1', 'lesson-2'])
  })
})
