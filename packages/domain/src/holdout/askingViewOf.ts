import type { Band } from '#learning/curriculum/Band'
import type { Scaffold } from '#learning/scaffold/Scaffold'
import { placementItemsOf } from '#placement/placementItemsOf'
import type { PlacementWordCatalog } from '#placement/ports/PlacementWordCatalog'
import type { BegunHoldoutCheck } from './HoldoutCheck'
import type { HoldoutCheckView } from './HoldoutCheckView'

export const askingViewOf = (
  band: Band,
  { week, sample }: BegunHoldoutCheck,
  words: PlacementWordCatalog,
  scaffold: Scaffold,
): HoldoutCheckView => ({
  kind: 'asking',
  band,
  week,
  items: placementItemsOf({ band, wordIds: sample.wordIds }, words, scaffold),
})
