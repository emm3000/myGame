import type { Band, BandWord, Headword } from '../learning/BandStart'
import type { PlacementWord } from '../placement/PlacementWord'
import type { PlacementContent } from '../placement/placementSamplesDrawn'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'

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
    return { id: `word-${name}`, headword: name, word: name, gloss: `gloss-${name}`, isChrome }
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
