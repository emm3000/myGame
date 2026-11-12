import type { Band } from '../learning/BandStart'
import type { WordId } from '../learning/Lesson'
import type { PlacementScore } from './Placement'

export type PlacementItem = {
  readonly wordId: WordId
  readonly word: string
  readonly choices: ReadonlyArray<{ readonly choiceId: string; readonly gloss: string }>
}

export type PlacementView =
  | { readonly kind: 'offered' }
  | {
      readonly kind: 'asking'
      readonly band: Band
      readonly items: ReadonlyArray<PlacementItem>
      readonly scores: ReadonlyArray<PlacementScore>
    }
  | { readonly kind: 'closed'; readonly scores: ReadonlyArray<PlacementScore> }
