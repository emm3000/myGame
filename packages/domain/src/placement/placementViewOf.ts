import type { BandStart } from '#learning/curriculum/BandStart'
import type { Scaffold } from '#learning/scaffold/Scaffold'
import { askedSampleOf } from './askedSampleOf'
import type { Placement } from './Placement'
import type { PlacementView } from './PlacementView'
import { placementItemsOf } from './placementItemsOf'
import type { PlacementWordCatalog } from './ports/PlacementWordCatalog'

export const placementViewOf = (
  placement: Placement,
  starts: ReadonlyArray<BandStart>,
  words: PlacementWordCatalog,
  scaffold: Scaffold,
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
    items: placementItemsOf(asked, words, scaffold),
    scores: placement.scores,
  }
}
