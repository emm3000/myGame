import type { Band } from '../learning/BandStart'
import type { PlacementWord } from '../placement/PlacementWord'

export interface PlacementWordCatalog {
  placementWordsOf(band: Band): ReadonlyArray<PlacementWord>
}
