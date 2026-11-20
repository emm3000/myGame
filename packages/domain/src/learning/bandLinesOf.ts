import type { BandCatalog } from '../ports/BandCatalog'
import type { LessonCatalog } from '../ports/LessonCatalog'
import type { Band, BandStart, Headword } from './BandStart'
import type { HeldCard } from './HeldCard'
import { headwordOf } from './headwordOf'

export type BandLine = {
  readonly band: Band
  readonly count: number
  readonly total: number
}

export type BandLineContent = {
  readonly lessons: Pick<LessonCatalog, 'lessonOfWord'>
  readonly bands: Pick<BandCatalog, 'wordsOfBand'>
}

const heldHeadwordsOf = (
  held: ReadonlyArray<HeldCard>,
  lessons: BandLineContent['lessons'],
): ReadonlySet<Headword> =>
  new Set(
    held.flatMap(({ wordId }) =>
      (lessons.lessonOfWord(wordId)?.words ?? [])
        .filter(({ id }) => id === wordId)
        .map(({ acceptedForms }) => headwordOf(acceptedForms[0])),
    ),
  )

export const bandLinesOf = (
  starts: ReadonlyArray<BandStart>,
  held: ReadonlyArray<HeldCard>,
  { lessons, bands }: BandLineContent,
): ReadonlyArray<BandLine> => {
  const heldHeadwords = heldHeadwordsOf(held, lessons)
  return starts.map(({ band }) => {
    const cardWords = bands.wordsOfBand(band).filter(({ isChrome }) => !isChrome)
    return {
      band,
      count: cardWords.filter(({ headword }) => heldHeadwords.has(headword)).length,
      total: cardWords.length,
    }
  })
}
