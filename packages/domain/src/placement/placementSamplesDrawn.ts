import type { Band } from '../learning/BandStart'
import type { BandCatalog } from '../ports/BandCatalog'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import type { RandomSource } from '../ports/RandomSource'
import type { PlacementSample } from './Placement'

export const PLACEMENT_SAMPLE_SIZE = 30

const FIRST_BAND: Band = 1

export type PlacementContent = {
  readonly words: PlacementWordCatalog
  readonly bands: Pick<BandCatalog, 'wordsOfBand' | 'hasLessons'>
}

const drawableWordIdsOf = (band: Band, words: PlacementWordCatalog): ReadonlyArray<string> =>
  words
    .placementWordsOf(band)
    .filter(({ isChrome }) => !isChrome)
    .map(({ id }) => id)

const isBandDrafted = (band: Band, { words, bands }: PlacementContent): boolean => {
  const entered = new Set(words.placementWordsOf(band).map(({ headword }) => headword))
  const bandWords = bands.wordsOfBand(band)
  return bandWords.length > 0 && bandWords.every(({ headword }) => entered.has(headword))
}

const isNextBandOpen = (band: Band, { bands }: PlacementContent): boolean =>
  bands.wordsOfBand(band + 1).length === 0 || bands.hasLessons(band + 1)

const isBandPlaceable = (band: Band, content: PlacementContent): boolean =>
  isBandDrafted(band, content) &&
  isNextBandOpen(band, content) &&
  drawableWordIdsOf(band, content.words).length >= PLACEMENT_SAMPLE_SIZE

const placeableBandsOf = (content: PlacementContent): ReadonlyArray<Band> => {
  const placeable: Array<Band> = []
  for (let band = FIRST_BAND; isBandPlaceable(band, content); band += 1) {
    placeable.push(band)
  }
  return placeable
}

export const isPlacementDrawable = (content: PlacementContent): boolean =>
  isBandPlaceable(FIRST_BAND, content)

export const placementSamplesDrawn = (
  content: PlacementContent,
  random: RandomSource,
): ReadonlyArray<PlacementSample> =>
  placeableBandsOf(content).map((band) => ({
    band,
    wordIds: random.sampleOf(drawableWordIdsOf(band, content.words), PLACEMENT_SAMPLE_SIZE),
  }))
