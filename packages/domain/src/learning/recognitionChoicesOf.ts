import { mixed32 } from '../hash/mixed32'
import type { MemoryCard } from '../memory/MemoryCard'
import { compareWordIds } from './compareWordIds'
import type { Lesson, WordId } from './Lesson'

const MAXIMUM_CHOICES = 5

const HIGH_WORD = 2 ** 32

type HashedWord = {
  readonly wordId: WordId
  readonly hash: number
}

const hashOf = (wordId: WordId, keyMilliseconds: number): number => {
  const seeded = mixed32(mixed32(keyMilliseconds >>> 0) ^ Math.floor(keyMilliseconds / HIGH_WORD))
  return [...wordId].reduce(
    (hash, character) => mixed32(hash ^ (character.codePointAt(0) ?? 0)),
    seeded,
  )
}

const byHashThenWord = (left: HashedWord, right: HashedWord): number =>
  left.hash - right.hash || compareWordIds(left.wordId, right.wordId)

export const recognitionChoicesOf = (
  wordId: WordId,
  lesson: Lesson,
  card: MemoryCard,
): ReadonlyArray<WordId> => {
  const keyMilliseconds = (card.stored.lastReviewAt ?? card.stored.enteredAt).epochMilliseconds
  const hashed = (id: WordId): HashedWord => ({ wordId: id, hash: hashOf(id, keyMilliseconds) })
  const others = lesson.words
    .filter(({ id }) => id !== wordId)
    .map(({ id }) => hashed(id))
    .sort(byHashThenWord)
    .slice(0, MAXIMUM_CHOICES - 1)
  return [hashed(wordId), ...others].sort(byHashThenWord).map((word) => word.wordId)
}
