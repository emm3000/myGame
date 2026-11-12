import type { BandStart } from '../learning/BandStart'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import { askedSampleOf } from './askedSampleOf'
import type { Placement } from './Placement'
import type { PlacementView } from './PlacementView'
import { placementItemsOf } from './placementItemsOf'

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
  return {
    kind: 'asking',
    band: asked.band,
    items: placementItemsOf(asked, words),
    scores: placement.scores,
  }
}
