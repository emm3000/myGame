import type { Band } from '../learning/curriculum/BandStart'
import type { PlacementWord } from '../placement/PlacementWord'

export interface PlacementWordCatalog {
  placementWordsOf(band: Band): ReadonlyArray<PlacementWord>
}
