import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import type { PlacementSample } from './Placement'
import type { PlacementItem } from './PlacementView'
import { placementQuestionsOf } from './placementQuestionsOf'

export const placementItemsOf = (
  sample: PlacementSample,
  words: PlacementWordCatalog,
): ReadonlyArray<PlacementItem> =>
  placementQuestionsOf(sample, words).map(({ word, choices }) => ({
    wordId: word.id,
    word: word.word,
    choices: choices.map(({ choiceId, word: chosen }) => ({ choiceId, gloss: chosen.gloss })),
  }))
