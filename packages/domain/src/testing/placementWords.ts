import type { Band } from '../learning/BandStart'
import type { PlacementWord } from '../placement/PlacementWord'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'

export type PlacementShelf = {
  readonly band: Band
  readonly words: ReadonlyArray<PlacementWord>
}

export const placementWordsOfBand = (
  band: Band,
  count: number,
  isChrome = false,
): ReadonlyArray<PlacementWord> =>
  Array.from({ length: count }, (_, index) => {
    const name = `${isChrome ? 'chrome' : 'card'}-${band}-${index + 1}`
    return { id: `word-${name}`, word: name, gloss: `gloss-${name}`, isChrome }
  })

export const inMemoryPlacementWords = (
  shelves: ReadonlyArray<PlacementShelf>,
): PlacementWordCatalog => ({
  placementWordsOf: (band) => shelves.find((shelf) => shelf.band === band)?.words ?? [],
})
