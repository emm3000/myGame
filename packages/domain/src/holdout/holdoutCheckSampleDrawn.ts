import type { BandStart } from '../learning/BandStart'
import type { HeldCard } from '../learning/HeldCard'
import { holdsLessonCards } from '../learning/holdsLessonCards'
import type { LessonCatalog } from '../ports/LessonCatalog'
import type { PlacementWordCatalog } from '../ports/PlacementWordCatalog'
import type { RandomSource } from '../ports/RandomSource'
import type { HoldoutCheckSample } from './HoldoutCheck'

export type HoldoutCheckContent = {
  readonly lessons: Pick<LessonCatalog, 'lessonOfWord'>
  readonly words: PlacementWordCatalog
}

export const holdoutCheckSampleDrawn = (
  { band, heldOutWords }: BandStart,
  held: ReadonlyArray<HeldCard>,
  { lessons, words }: HoldoutCheckContent,
  random: RandomSource,
): HoldoutCheckSample => {
  const ofStudiedLessons = words.placementWordsOf(band).filter(({ id, isChrome }) => {
    const lesson = lessons.lessonOfWord(id)
    return !isChrome && lesson !== undefined && holdsLessonCards(lesson, held)
  })
  const heldOutWordIds = ofStudiedLessons
    .filter(({ headword }) => heldOutWords.includes(headword))
    .map(({ id }) => id)
  const practised = ofStudiedLessons
    .filter(({ id }) => held.some(({ wordId }) => wordId === id))
    .map(({ id }) => id)
  const asked = [
    ...heldOutWordIds,
    ...random.sampleOf(practised, Math.min(practised.length, heldOutWordIds.length)),
  ]
  return { wordIds: random.sampleOf(asked, asked.length), heldOutWordIds }
}
