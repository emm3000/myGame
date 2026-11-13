import { choiceIdsOf } from '../hash/choiceIdsOf'
import { textHashOf } from '../hash/textHashOf'
import { compareWordIds } from '../learning/compareWordIds'
import { glossOf } from '../learning/glossOf'
import type { Scaffold } from '../learning/Scaffold'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import type { PlacementSample } from './Placement'
import type { PlacementWord } from './PlacementWord'

const CHOICE_COUNT = 4

const QUESTION_SEED = 0x9e3779b9

export type PlacementChoice = {
  readonly choiceId: string
  readonly word: PlacementWord
}

export type PlacementQuestion = {
  readonly word: PlacementWord
  readonly choices: ReadonlyArray<PlacementChoice>
}

type HashedWord = {
  readonly word: PlacementWord
  readonly hash: number
}

const byHashThenWord = (left: HashedWord, right: HashedWord): number =>
  left.hash - right.hash || compareWordIds(left.word.id, right.word.id)

const questionOf = (
  asked: PlacementWord,
  sampled: ReadonlyArray<PlacementWord>,
  scaffold: Scaffold,
): PlacementQuestion => {
  const seed = textHashOf(asked.id, QUESTION_SEED)
  const hashed = (word: PlacementWord): HashedWord => ({ word, hash: textHashOf(word.id, seed) })
  const shownOf = (word: PlacementWord): string => glossOf(word, scaffold)
  const others = sampled
    .filter((word) => shownOf(word) !== shownOf(asked))
    .map(hashed)
    .sort(byHashThenWord)
    .filter(
      (candidate, index, ordered) =>
        ordered.findIndex(({ word }) => shownOf(word) === shownOf(candidate.word)) === index,
    )
    .slice(0, CHOICE_COUNT - 1)
  const offered = choiceIdsOf([hashed(asked), ...others].sort(byHashThenWord))
  return { word: asked, choices: offered.map(({ choiceId, word }) => ({ choiceId, word })) }
}

export const placementQuestionsOf = (
  { band, wordIds }: PlacementSample,
  words: PlacementWordCatalog,
  scaffold: Scaffold,
): ReadonlyArray<PlacementQuestion> => {
  const bandWords = words.placementWordsOf(band)
  const sampled = wordIds.flatMap((wordId) => bandWords.find(({ id }) => id === wordId) ?? [])
  return sampled.map((asked) => questionOf(asked, sampled, scaffold))
}
