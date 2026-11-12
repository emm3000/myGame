import type { BandStart } from '../learning/BandStart'
import type { PlacementSample, TakenPlacement } from './Placement'

export const PLACEMENT_PASSING_SCORE = 29

export const askedSampleOf = (
  { samples, scores }: TakenPlacement,
  starts: ReadonlyArray<BandStart>,
): PlacementSample | undefined => {
  if (scores.some(({ score }) => score < PLACEMENT_PASSING_SCORE)) {
    return undefined
  }
  const asked = samples.find(({ band }) => !scores.some((score) => score.band === band))
  if (asked === undefined || starts.some(({ band }) => band === asked.band)) {
    return undefined
  }
  return asked
}
