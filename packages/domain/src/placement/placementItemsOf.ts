import { glossOf } from '../learning/glossOf'
import type { Scaffold } from '../learning/Scaffold'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import type { PlacementSample } from './Placement'
import type { PlacementItem } from './PlacementView'
import { placementQuestionsOf } from './placementQuestionsOf'

export const placementItemsOf = (
  sample: PlacementSample,
  words: PlacementWordCatalog,
  scaffold: Scaffold,
): ReadonlyArray<PlacementItem> =>
  placementQuestionsOf(sample, words, scaffold).map(({ word, choices }) => ({
    wordId: word.id,
    word: word.word,
    choices: choices.map(({ choiceId, word: chosen }) => ({
      choiceId,
      gloss: glossOf(chosen, scaffold),
    })),
  }))
