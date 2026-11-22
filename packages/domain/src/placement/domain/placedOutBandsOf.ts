import type { Band } from '#learning/curriculum/domain/Band'
import { PLACEMENT_PASSING_SCORE } from './askedSampleOf'
import type { PlacementScore } from './Placement'

export const placedOutBandsOf = (scores: ReadonlyArray<PlacementScore>): ReadonlyArray<Band> =>
  scores.filter(({ score }) => score >= PLACEMENT_PASSING_SCORE).map(({ band }) => band)
