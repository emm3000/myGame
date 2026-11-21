import type { BandStart } from '../learning/curriculum/BandStart'
import type { LessonCatalog } from '../learning/curriculum/ports/LessonCatalog'
import type { HeldCard } from '../learning/HeldCard'
import { heldCardsOf } from '../learning/HeldCards'
import { holdsLessonCards } from '../learning/holdsLessonCards'
import type { PlacementWordCatalog } from '../placement/ports/PlacementWordCatalog'
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
  const heldByWord = heldCardsOf(held)
  const practised = ofStudiedLessons.filter(({ id }) => heldByWord.has(id)).map(({ id }) => id)
  const asked = [
    ...heldOutWordIds,
    ...random.sampleOf(practised, Math.min(practised.length, heldOutWordIds.length)),
  ]
  return { wordIds: random.sampleOf(asked, asked.length), heldOutWordIds }
}
