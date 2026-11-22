import type { Band } from '#learning/curriculum/domain/Band'
import type { Scaffold } from '#learning/scaffold/domain/Scaffold'
import type { PlacementWordCatalog } from '#placement/domain/PlacementWordCatalog'
import { placementItemsOf } from '#placement/domain/placementItemsOf'
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
