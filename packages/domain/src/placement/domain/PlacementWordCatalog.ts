import type { Band } from '#learning/curriculum/domain/Band'
import type { PlacementWord } from './PlacementWord'

export interface PlacementWordCatalog {
  placementWordsOf(band: Band): ReadonlyArray<PlacementWord>
}
