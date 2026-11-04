import { assert, describe, expect, it } from 'vitest'
import { MemoryCard } from '../memory/MemoryCard'
import { defaultMemoryTerms } from '../memory/MemoryTerms'
import { Instant } from '../time/Instant'
import { dueCardsAt } from './dueCardsAt'
import type { HeldCard } from './HeldCard'

const MILLISECONDS_PER_MINUTE = 60_000

const lessonFinish = Instant.fromEpochMilliseconds(1_794_301_200_000)

const minutesAfterFinish = (minutes: number): Instant =>
  Instant.fromEpochMilliseconds(lessonFinish.epochMilliseconds + minutes * MILLISECONDS_PER_MINUTE)

const enteredAt = (wordId: string, minutes: number): HeldCard => ({
  wordId,
  card: MemoryCard.entered(minutesAfterFinish(minutes)),
})

const dueWordsAt = (cards: ReadonlyArray<HeldCard>, minutes: number): ReadonlyArray<string> => {
  const due = dueCardsAt(cards, minutesAfterFinish(minutes), defaultMemoryTerms)
  assert(due.ok)
  return due.value.map(({ wordId }) => wordId)
}

describe('dueCardsAt', () => {
  it('answers exactly the cards due at or before now, in due order', () => {
    const cards = [enteredAt('money', 5), enteredAt('home', 0), enteredAt('food', 6)]

    expect(dueWordsAt(cards, 5)).toEqual(['home', 'money'])
  })

  it('leaves out a card due one millisecond after now', () => {
    const cards = [enteredAt('home', 1)]

    const due = dueCardsAt(
      cards,
      Instant.fromEpochMilliseconds(minutesAfterFinish(1).epochMilliseconds - 1),
      defaultMemoryTerms,
    )

    assert(due.ok)
    expect(due.value).toEqual([])
  })

  it('orders cards due at the same instant by word id', () => {
    const cards = [enteredAt('work', 0), enteredAt('food', 0), enteredAt('school', 0)]

    expect(dueWordsAt(cards, 0)).toEqual(['food', 'school', 'work'])
  })
})
