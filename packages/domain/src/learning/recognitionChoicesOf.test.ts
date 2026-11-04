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
  })),
}

describe('recognitionChoicesOf', () => {
  it('offers every word of a lesson of five, the asked word among them', () => {
    const choices = recognitionChoicesOf('school', lessonOne, enteredCard)

    expect([...choices].sort()).toEqual(['food', 'home', 'money', 'school', 'work'])
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

    expect(choices).toHaveLength(5)
    expect(choices).toContain('town')
    expect(new Set(choices).size).toBe(5)
  })
})
