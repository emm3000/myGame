import type { Band } from '#learning/curriculum/Band'
import { BANDS, laterBandOf } from '#learning/curriculum/bands'
import type { BandCatalog } from '#learning/curriculum/ports/BandCatalog'
import type { RandomSource } from '#platform/domain/RandomSource'
import type { PlacementSample } from './Placement'
import type { PlacementWordCatalog } from './PlacementWordCatalog'

export const PLACEMENT_SAMPLE_SIZE = 30

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

const isNextBandOpen = (band: Band, { bands }: PlacementContent): boolean => {
  const later = laterBandOf(band)
  return later === undefined || bands.wordsOfBand(later).length === 0 || bands.hasLessons(later)
}

const isBandPlaceable = (band: Band, content: PlacementContent): boolean =>
  isBandDrafted(band, content) &&
  isNextBandOpen(band, content) &&
  drawableWordIdsOf(band, content.words).length >= PLACEMENT_SAMPLE_SIZE

const placeableBandsOf = (content: PlacementContent): ReadonlyArray<Band> => {
  const firstUnplaceable = BANDS.findIndex((band) => !isBandPlaceable(band, content))
  return firstUnplaceable === -1 ? BANDS : BANDS.slice(0, firstUnplaceable)
}

export const isPlacementDrawable = (content: PlacementContent): boolean =>
  placeableBandsOf(content).length > 0

export const placementSamplesDrawn = (
  content: PlacementContent,
  random: RandomSource,
): ReadonlyArray<PlacementSample> =>
  placeableBandsOf(content).map((band) => ({
    band,
    wordIds: random.sampleOf(drawableWordIdsOf(band, content.words), PLACEMENT_SAMPLE_SIZE),
  }))
