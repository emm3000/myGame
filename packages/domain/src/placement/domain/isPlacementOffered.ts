import type { BandStart } from '#holdout/BandStart'
import { isPlacementDrawable, type PlacementContent } from './placementSamplesDrawn'

export const isPlacementOffered = (
  starts: ReadonlyArray<BandStart>,
  content: PlacementContent,
): boolean => starts.length === 0 && isPlacementDrawable(content)
