import type { Band } from '../learning/BandStart'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import type { RandomSource } from '../ports/RandomSource'
import type { PlacementSample } from './Placement'

export const PLACEMENT_SAMPLE_SIZE = 30

const FIRST_BAND: Band = 1

export const drawableWordIdsOf = (band: Band, words: PlacementWordCatalog): ReadonlyArray<string> =>
  words
    .placementWordsOf(band)
    .filter(({ isChrome }) => !isChrome)
    .map(({ id }) => id)

export const isPlacementDrawable = (words: PlacementWordCatalog): boolean =>
  drawableWordIdsOf(FIRST_BAND, words).length >= PLACEMENT_SAMPLE_SIZE

export const placementSamplesDrawn = (
  words: PlacementWordCatalog,
  random: RandomSource,
): ReadonlyArray<PlacementSample> => {
  const samples: Array<PlacementSample> = []
  let band = FIRST_BAND
  let drawable = drawableWordIdsOf(band, words)
  while (drawable.length >= PLACEMENT_SAMPLE_SIZE) {
    samples.push({ band, wordIds: random.sampleOf(drawable, PLACEMENT_SAMPLE_SIZE) })
    band += 1
    drawable = drawableWordIdsOf(band, words)
  }
  return samples
}
