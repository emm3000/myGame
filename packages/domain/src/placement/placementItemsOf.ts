import { glossOf } from '../learning/scaffold/glossOf'
import type { Scaffold } from '../learning/scaffold/Scaffold'
import type { PlacementSample } from './Placement'
import type { PlacementItem } from './PlacementView'
import { placementQuestionsOf } from './placementQuestionsOf'
import type { PlacementWordCatalog } from './ports/PlacementWordCatalog'

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
