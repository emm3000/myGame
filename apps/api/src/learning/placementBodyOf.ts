import { type Placement, PlacementBandSchema } from '@mygame/contracts'
import { type PlacementScore, type PlacementView, placedOutBandsOf } from '@mygame/domain'
import { isoOf } from '../http/isoOf'

type PlacementScores = Extract<Placement, { readonly kind: 'closed' }>['scores']

const scoresOf = (scores: ReadonlyArray<PlacementScore>): PlacementScores => {
  const placedOut = placedOutBandsOf(scores)
  return scores.map(({ band, score, takenAt }) => ({
    band: PlacementBandSchema.parse(band),
    score,
    takenAt: isoOf(takenAt),
    isPlacedOut: placedOut.includes(band),
  }))
}

export const placementBodyOf = (view: PlacementView): Placement => {
  switch (view.kind) {
    case 'offered':
      return { kind: 'offered' }
    case 'asking':
      return {
        kind: 'asking',
        band: PlacementBandSchema.parse(view.band),
        items: view.items.map(({ wordId, word, choices }) => ({
          wordId,
          word,
          choices: choices.map(({ choiceId, gloss }) => ({ choiceId, gloss })),
        })),
        scores: scoresOf(view.scores),
      }
    case 'closed':
      return { kind: 'closed', scores: scoresOf(view.scores) }
  }
}
