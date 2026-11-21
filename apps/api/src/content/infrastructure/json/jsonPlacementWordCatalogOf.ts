import type { PlacementWordCatalog } from '@mygame/domain'
import type { LessonShelf } from './LessonShelf'

export const jsonPlacementWordCatalogOf = ({
  placementWords,
}: LessonShelf): PlacementWordCatalog => ({
  placementWordsOf: (band) => placementWords.get(band) ?? [],
})
