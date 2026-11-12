import type { BandStart } from '../learning/BandStart'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import { askedSampleOf } from './askedSampleOf'
import type { Placement } from './Placement'
import type { PlacementView } from './PlacementView'
import { placementQuestionsOf } from './placementQuestionsOf'

export const placementViewOf = (
  placement: Placement,
  starts: ReadonlyArray<BandStart>,
  words: PlacementWordCatalog,
): PlacementView => {
  if (placement.kind === 'skipped') {
    return { kind: 'closed', scores: [] }
  }
  const asked = askedSampleOf(placement, starts)
  if (asked === undefined) {
    return { kind: 'closed', scores: placement.scores }
  }
  const items = placementQuestionsOf(asked, words).map(({ word, choices }) => ({
    wordId: word.id,
    word: word.word,
    choices: choices.map(({ choiceId, word: chosen }) => ({ choiceId, gloss: chosen.gloss })),
  }))
  return { kind: 'asking', band: asked.band, items, scores: placement.scores }
}
