import type { Band } from '#learning/curriculum/domain/Band'
import type { BandWord } from '#learning/curriculum/domain/BandWord'
import type { Headword } from '#learning/curriculum/domain/Headword'
import type { PlacementWord } from '../domain/PlacementWord'
import type { PlacementWordCatalog } from '../domain/PlacementWordCatalog'
import type { PlacementContent } from '../domain/placementSamplesDrawn'

export type PlacementShelf = {
  readonly band: Band
  readonly words: ReadonlyArray<PlacementWord>
  readonly undraftedHeadwords?: ReadonlyArray<Headword>
  readonly isTaught?: boolean
}

export const placementWordsOfBand = (
  band: Band,
  count: number,
  isChrome = false,
): ReadonlyArray<PlacementWord> =>
  Array.from({ length: count }, (_, index) => {
    const name = `${isChrome ? 'chrome' : 'card'}-${band}-${index + 1}`
    return {
      id: `word-${name}`,
      headword: name,
      word: name,
      gloss: `gloss-${name}`,
      definition: `definition-${name}`,
      isChrome,
    }
  })

export const inMemoryPlacementWords = (
  shelves: ReadonlyArray<PlacementShelf>,
): PlacementWordCatalog => ({
  placementWordsOf: (band) => shelves.find((shelf) => shelf.band === band)?.words ?? [],
})

const bandWordsOf = ({
  words,
  undraftedHeadwords = [],
}: PlacementShelf): ReadonlyArray<BandWord> => [
  ...words.map(({ headword, isChrome }) => ({ headword, isChrome })),
  ...undraftedHeadwords.map((headword) => ({ headword, isChrome: false })),
]

export const placementContentOf = (shelves: ReadonlyArray<PlacementShelf>): PlacementContent => ({
  words: inMemoryPlacementWords(shelves),
  bands: {
    wordsOfBand: (band) => {
      const shelf = shelves.find((candidate) => candidate.band === band)
      return shelf === undefined ? [] : bandWordsOf(shelf)
    },
    hasLessons: (band) => shelves.some((shelf) => shelf.band === band && (shelf.isTaught ?? true)),
  },
})
