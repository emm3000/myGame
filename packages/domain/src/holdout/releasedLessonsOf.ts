import type { BandStart } from '../learning/BandStart'
import { compareWordIds } from '../learning/compareWordIds'
import type { HeldCard } from '../learning/HeldCard'
import { isUnitLemma } from '../learning/isUnitLemma'
import type { Lesson, LessonWord, SchoolLesson } from '../learning/Lesson'
import { lemmaWordsOf } from '../learning/lemmaWordsOf'
import type { BandCatalog } from '../ports/BandCatalog'
import type { LessonCatalog } from '../ports/LessonCatalog'
import type { Instant } from '../time/Instant'
import { releasedAtOf } from './releasedAtOf'

const RELEASED_LESSON_WORD_COUNT = 5

export type ReleaseContent = {
  readonly lessons: Pick<LessonCatalog, 'lessonOfWord'>
  readonly bands: Pick<BandCatalog, 'wordsOfBand'>
}

type ReleasedItem = {
  readonly word: LessonWord
  readonly from: Lesson
  readonly rank: number
  readonly isUnit: boolean
}

type Release = {
  readonly start: BandStart
  readonly releasedAt: Instant
}

const heldOutLemmaWordsOf = ({ acceptedForms }: LessonWord, start: BandStart) =>
  lemmaWordsOf(acceptedForms[0]).filter((word) => start.heldOutWords.includes(word))

const isLaterRelease = (left: Release, right: Release): boolean =>
  left.releasedAt.epochMilliseconds > right.releasedAt.epochMilliseconds ||
  (left.releasedAt.epochMilliseconds === right.releasedAt.epochMilliseconds &&
    left.start.band > right.start.band)

const releasingBandOf = (
  word: LessonWord,
  starts: ReadonlyArray<BandStart>,
): Release | undefined => {
  let last: Release | undefined
  for (const start of starts.filter((held) => heldOutLemmaWordsOf(word, held).length > 0)) {
    const releasedAt = releasedAtOf(start)
    if (releasedAt === undefined) {
      return undefined
    }
    const release = { start, releasedAt }
    if (last === undefined || isLaterRelease(release, last)) {
      last = release
    }
  }
  return last
}

const lessonsStudiedBefore = (
  releasedAt: Instant,
  held: ReadonlyArray<HeldCard>,
  { lessons }: ReleaseContent,
): ReadonlyArray<Lesson> => {
  const studied = new Map<string, Lesson>()
  for (const { wordId, card } of held) {
    const lesson = lessons.lessonOfWord(wordId)
    if (
      lesson !== undefined &&
      card.stored.enteredAt.epochMilliseconds < releasedAt.epochMilliseconds
    ) {
      studied.set(lesson.id, lesson)
    }
  }
  return [...studied.values()]
}

const byRankThenWord = (left: ReleasedItem, right: ReleasedItem): number =>
  left.rank - right.rank ||
  Number(left.isUnit) - Number(right.isUnit) ||
  compareWordIds(left.word.id, right.word.id)

const releasedItemsOf = (
  { start, releasedAt }: Release,
  starts: ReadonlyArray<BandStart>,
  held: ReadonlyArray<HeldCard>,
  content: ReleaseContent,
): ReadonlyArray<ReleasedItem> => {
  const ranks = content.bands.wordsOfBand(start.band).map(({ headword }) => headword)
  return lessonsStudiedBefore(releasedAt, held, content)
    .flatMap((from) =>
      from.words.flatMap((word) => {
        const heldOut = heldOutLemmaWordsOf(word, start)
        if (heldOut.length === 0 || releasingBandOf(word, starts)?.start.band !== start.band) {
          return []
        }
        const rank = Math.max(...heldOut.map((headword) => ranks.indexOf(headword)))
        return [{ word, from, rank, isUnit: isUnitLemma(word.acceptedForms[0]) }]
      }),
    )
    .sort(byRankThenWord)
}

const wordCountOf = (items: ReadonlyArray<ReleasedItem>): number =>
  items.filter(({ isUnit }) => !isUnit).length

const lessonsOfFive = (
  items: ReadonlyArray<ReleasedItem>,
): ReadonlyArray<ReadonlyArray<ReleasedItem>> => {
  const lessons: Array<Array<ReleasedItem>> = []
  for (const item of items) {
    const current = lessons.at(-1)
    if (
      current === undefined ||
      (!item.isUnit && wordCountOf(current) === RELEASED_LESSON_WORD_COUNT)
    ) {
      lessons.push([item])
    } else {
      current.push(item)
    }
  }
  return lessons
}

const releasedLessonOf = (
  { start }: Release,
  items: ReadonlyArray<ReleasedItem>,
  position: number,
): SchoolLesson => ({
  id: `released-${start.band}-${position + 1}`,
  durationSeconds: Math.max(...items.map(({ from }) => from.durationSeconds)),
  requiredSchoolLevel: Math.max(...items.map(({ from }) => from.requiredSchoolLevel)),
  words: items.map(({ word }) => word),
})

export const releasedLessonsOf = (
  starts: ReadonlyArray<BandStart>,
  held: ReadonlyArray<HeldCard>,
  content: ReleaseContent,
): ReadonlyArray<SchoolLesson> =>
  starts.flatMap((start) => {
    const releasedAt = releasedAtOf(start)
    if (releasedAt === undefined) {
      return []
    }
    const release = { start, releasedAt }
    return lessonsOfFive(releasedItemsOf(release, starts, held, content)).map((items, position) =>
      releasedLessonOf(release, items, position),
    )
  })
