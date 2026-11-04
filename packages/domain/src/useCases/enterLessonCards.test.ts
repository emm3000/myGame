import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import { inMemoryCards, type OwnedCard } from '../testing/inMemoryCards'
import { inMemoryLessons } from '../testing/inMemoryLessons'
import { lessonOne } from '../testing/lessonOne'
import { Instant } from '../time/Instant'
import { enterLessonCards } from './enterLessonCards'

const lessonFinish = Instant.fromEpochMilliseconds(1_794_301_200_000)

const learner = 'player-learner'

const lessons = inMemoryLessons([lessonOne], [])

describe('enterLessonCards', () => {
  it('enters one new card per word of the lesson, due at its finish', async () => {
    const cards = inMemoryCards([])

    const entered = await enterLessonCards(
      { playerId: learner, lessonId: lessonOne.id, enteredAt: lessonFinish },
      { cards, lessons },
    )

    assert(entered.ok)
    const held = await cards.cardsOf(learner)
    assert(held.ok)
    expect(held.value.map(({ wordId }) => wordId)).toEqual([
      'home',
      'school',
      'work',
      'money',
      'food',
    ])
    expect(held.value.map(({ card }) => card.stored)).toEqual(
      Array.from({ length: 5 }, () => MemoryCard.entered(lessonFinish).stored),
    )
  })

  it('enters none when the player already holds the lesson cards', async () => {
    const reviewedAt = Instant.fromEpochMilliseconds(lessonFinish.epochMilliseconds - 1)
    const owned: OwnedCard = {
      playerId: learner,
      wordId: 'school',
      card: MemoryCard.entered(reviewedAt),
    }
    const cards = inMemoryCards([owned])

    const entered = await enterLessonCards(
      { playerId: learner, lessonId: lessonOne.id, enteredAt: lessonFinish },
      { cards, lessons },
    )

    assert(entered.ok)
    expect(entered.value).toEqual([])
    const held = await cards.cardsOf(learner)
    assert(held.ok)
    expect(held.value).toEqual([owned].map(({ wordId, card }) => ({ wordId, card })))
  })

  it('refuses a lesson the content does not hold', async () => {
    const entered = await enterLessonCards(
      { playerId: learner, lessonId: 'lesson-9', enteredAt: lessonFinish },
      { cards: inMemoryCards([]), lessons },
    )

    expect(entered).toEqual({ ok: false, error: { kind: 'LessonNotFound', lessonId: 'lesson-9' } })
  })
})
