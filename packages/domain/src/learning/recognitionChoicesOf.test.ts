import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { reviewMemoryCard } from '../memory/reviewMemoryCard'
import { lessonOne } from '../testing/lessonOne'
import { Instant } from '../time/Instant'
import type { Lesson } from './Lesson'
import { recognitionChoicesOf } from './recognitionChoicesOf'

const lessonFinish = Instant.fromEpochMilliseconds(1_794_301_200_000)

const enteredCard = MemoryCard.entered(lessonFinish)

const lessonOfEightWords: Lesson = {
  ...lessonOne,
  words: ['home', 'school', 'work', 'money', 'food', 'day', 'week', 'town'].map((id) => ({
    id,
    acceptedForms: [id],
    gloss: id,
    frame: id,
    gappedFrame: id,
  })),
}

describe('recognitionChoicesOf', () => {
  it('offers every word of a lesson of five, the asked word among them', () => {
    const choices = recognitionChoicesOf('school', lessonOne, enteredCard)

    expect(choices.map(({ wordId }) => wordId).sort()).toEqual([
      'food',
      'home',
      'money',
      'school',
      'work',
    ])
  })

  it('gives each choice an id of its own that is never a word id', () => {
    const choiceIds = recognitionChoicesOf('school', lessonOne, enteredCard).map(
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
      recognitionChoicesOf('school', lessonOne, card).find(({ wordId }) => wordId === 'school')
        ?.choiceId

    expect(choiceIdOfSchool(reviewed.value)).not.toBe(choiceIdOfSchool(enteredCard))
  })

  it('answers the same order on every read of the same card', () => {
    expect(recognitionChoicesOf('school', lessonOne, enteredCard)).toEqual(
      recognitionChoicesOf('school', lessonOne, enteredCard),
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

    expect(recognitionChoicesOf('school', lessonOne, later.value)).not.toEqual(
      recognitionChoicesOf('school', lessonOne, enteredCard),
    )
  })

  it('offers at most five words of a longer lesson, the asked word always among them', () => {
    const choices = recognitionChoicesOf('town', lessonOfEightWords, enteredCard)

    const wordIds = choices.map(({ wordId }) => wordId)
    expect(wordIds).toHaveLength(5)
    expect(wordIds).toContain('town')
    expect(new Set(wordIds).size).toBe(5)
  })
})
