import type { Band } from '#learning/curriculum/Band'
import type { PlacementWord } from '../PlacementWord'

export interface PlacementWordCatalog {
  placementWordsOf(band: Band): ReadonlyArray<PlacementWord>
}
