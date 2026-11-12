import { choiceIdsOf } from '../hash/choiceIdsOf'
import { keyedTextHashOf } from '../hash/keyedTextHashOf'
import type { MemoryCard } from '../memory/MemoryCard'
import { compareWordIds } from './compareWordIds'
import type { HeldCard } from './HeldCard'
import { keyInstantOf } from './keyInstantOf'
import type { Lesson, WordId } from './Lesson'

const MAXIMUM_CHOICES = 5

type HashedWord = {
  readonly wordId: WordId
  readonly hash: number
}

const byHashThenWord = (left: HashedWord, right: HashedWord): number =>
  left.hash - right.hash || compareWordIds(left.wordId, right.wordId)

export type RecognitionChoice = {
  readonly choiceId: string
  readonly wordId: WordId
}

const withChoiceIds = (offered: ReadonlyArray<HashedWord>): ReadonlyArray<RecognitionChoice> => {
  return choiceIdsOf(offered).map(({ choiceId, wordId }) => ({ choiceId, wordId }))
}

export const recognitionChoicesOf = (
  wordId: WordId,
  lesson: Lesson,
  card: MemoryCard,
  held: ReadonlyArray<HeldCard>,
): ReadonlyArray<RecognitionChoice> => {
  const keyMilliseconds = keyInstantOf(card).epochMilliseconds
  const hashed = (id: WordId): HashedWord => ({
    wordId: id,
    hash: keyedTextHashOf(id, keyMilliseconds),
  })
  const others = lesson.words
    .filter(({ id }) => id !== wordId && held.some((card) => card.wordId === id))
    .map(({ id }) => hashed(id))
    .sort(byHashThenWord)
    .slice(0, MAXIMUM_CHOICES - 1)
  return withChoiceIds([hashed(wordId), ...others].sort(byHashThenWord))
}
