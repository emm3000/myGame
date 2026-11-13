import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import { lessonOne } from '../testing/lessonOne'
import { unitLessonOne } from '../testing/unitLessonOne'
import { Instant } from '../time/Instant'
import type { HeldCard } from './HeldCard'
import type { Lesson } from './Lesson'
import { lessonCardsEnteredAt } from './lessonCardsEnteredAt'
import { recognitionChoicesOf } from './recognitionChoicesOf'

const lessonFinish = Instant.fromEpochMilliseconds(1_794_301_200_000)

const enteredCard = MemoryCard.entered(lessonFinish)

const lessonOfEightWords: Lesson = {
  ...lessonOne,
  words: ['home', 'school', 'work', 'money', 'food', 'day', 'week', 'town'].map((id) => ({
    id,
    acceptedForms: [id],
    gloss: id,
    definition: `definition of ${id}`,
    frames: [{ frame: id, gappedFrame: id }],
  })),
}

const cardsOf = (lesson: Lesson): ReadonlyArray<HeldCard> =>
  lesson.words.map(({ id }) => ({ wordId: id, card: enteredCard }))

const heldLessonOne = cardsOf(lessonOne)

const heldEightWords = cardsOf(lessonOfEightWords)

describe('recognitionChoicesOf', () => {
  it('leaves a held-out gloss out of the recognition choices', () => {
    const withoutHeldOutMoney = heldLessonOne.filter(({ wordId }) => wordId !== 'money')

    const choices = recognitionChoicesOf('school', lessonOne, enteredCard, withoutHeldOutMoney)

    expect(choices.map(({ wordId }) => wordId).sort()).toEqual(['food', 'home', 'school', 'work'])
  })

  it('never offers a held-back unit as a recognition choice', () => {
    const heldWithGiveHeldOut = lessonCardsEnteredAt(unitLessonOne, ['give'], lessonFinish)

    const choices = recognitionChoicesOf(
      'find-out',
      unitLessonOne,
      enteredCard,
      heldWithGiveHeldOut,
    )

    expect(choices.map(({ wordId }) => wordId).sort()).toEqual([
      'come-back',
      'find-out',
      'go-on',
      'of-course',
    ])
  })

  it('offers every word of a lesson of five, the asked word among them', () => {
    const choices = recognitionChoicesOf('school', lessonOne, enteredCard, heldLessonOne)

    expect(choices.map(({ wordId }) => wordId).sort()).toEqual([
      'food',
      'home',
      'money',
      'school',
      'work',
    ])
  })

  it('gives each choice an id of its own that is never a word id', () => {
    const choiceIds = recognitionChoicesOf('school', lessonOne, enteredCard, heldLessonOne).map(
      ({ choiceId }) => choiceId,
    )

    expect(new Set(choiceIds).size).toBe(5)
    expect(
      choiceIds.filter((choiceId) => lessonOne.words.some(({ id }) => id === choiceId)),
    ).toEqual([])
  })

  it('gives the asked word another choice id after a review moves the key instant', () => {
    const reviewed = reviewMemoryCard(
      enteredCard,
      'good',
      Instant.fromEpochMilliseconds(lessonFinish.epochMilliseconds + 60_000),
      defaultMemoryTerms,
    )
    assert(reviewed.ok)
    const choiceIdOfSchool = (card: MemoryCard): string | undefined =>
      recognitionChoicesOf('school', lessonOne, card, heldLessonOne).find(
        ({ wordId }) => wordId === 'school',
      )?.choiceId

    expect(choiceIdOfSchool(reviewed.value)).not.toBe(choiceIdOfSchool(enteredCard))
  })

  it('answers the same order on every read of the same card', () => {
    expect(recognitionChoicesOf('school', lessonOne, enteredCard, heldLessonOne)).toEqual(
      recognitionChoicesOf('school', lessonOne, enteredCard, heldLessonOne),
    )
  })

  it('reorders the choices after a review moves the key instant', () => {
    const reviewed = reviewMemoryCard(enteredCard, 'good', lessonFinish, defaultMemoryTerms)
    assert(reviewed.ok)
    const later = reviewMemoryCard(
      reviewed.value,
      'good',
      Instant.fromEpochMilliseconds(lessonFinish.epochMilliseconds + 600_000),
      defaultMemoryTerms,
    )
    assert(later.ok)

    expect(recognitionChoicesOf('school', lessonOne, later.value, heldLessonOne)).not.toEqual(
      recognitionChoicesOf('school', lessonOne, enteredCard, heldLessonOne),
    )
  })

  it('offers at most five words of a longer lesson, the asked word always among them', () => {
    const choices = recognitionChoicesOf('town', lessonOfEightWords, enteredCard, heldEightWords)

    const wordIds = choices.map(({ wordId }) => wordId)
    expect(wordIds).toHaveLength(5)
    expect(wordIds).toContain('town')
    expect(new Set(wordIds).size).toBe(5)
  })
})
