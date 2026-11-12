import type { Band } from '../learning/BandStart'
import { placementItemsOf } from '../placement/placementItemsOf'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import type { BegunHoldoutCheck } from './HoldoutCheck'
import type { HoldoutCheckView } from './HoldoutCheckView'

export const askingViewOf = (
  band: Band,
  { week, sample }: BegunHoldoutCheck,
  words: PlacementWordCatalog,
): HoldoutCheckView => ({
  kind: 'asking',
  band,
  week,
  items: placementItemsOf({ band, wordIds: sample.wordIds }, words),
})
