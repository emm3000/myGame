import { type Band, type BandWord, heldOutCountOf } from '@mygame/domain'
import { bandWordsOf } from '../adapters/json/bandWordsOf'
import { lessonBandsOf } from '../adapters/json/lessonBandsOf'
import type { LessonOfFiles } from '../adapters/json/lessonContentFilesOf'
import type { GateContent } from './GateContent'

const cardWordCountOf = (lessons: ReadonlyArray<LessonOfFiles>): number =>
  lessons.reduce((count, { words }) => count + words.length, 0)

const bandCardCountsOf = (
  content: GateContent,
  admitted: ReadonlyArray<LessonOfFiles>,
): ReadonlyMap<Band, number> => {
  const lessonBands = lessonBandsOf(content)
  const counts = new Map<Band, number>()
  for (const lesson of admitted) {
    const band = lessonBands.get(lesson.content.id)
    if (band !== undefined) {
      counts.set(band, (counts.get(band) ?? 0) + lesson.words.length)
    }
  }
  return counts
}

const heldOutCountOfBand = (
  bandWords: ReadonlyMap<Band, ReadonlyArray<BandWord>>,
  band: Band,
): number => {
  const words = bandWords.get(band)
  if (words === undefined) {
    throw new Error(`Band ${band} holds a lesson but no word of the list`)
  }
  return heldOutCountOf(words)
}

const wordsBeyondDrawsOf = (
  content: GateContent,
  admitted: ReadonlyArray<LessonOfFiles>,
): number => {
  const bandWords = bandWordsOf(content)
  return [...bandCardCountsOf(content, admitted)].reduce(
    (count, [band, cardCount]) =>
      count + Math.max(0, cardCount - heldOutCountOfBand(bandWords, band)),
    0,
  )
}

const isAdmittedAt = (lesson: LessonOfFiles, schoolLevel: number): boolean =>
  lesson.content.requiredSchoolLevel <= schoolLevel

export const countedWordsOf = (content: GateContent, schoolLevel: number): number => {
  const { chromeLessonCount } = content.curriculum
  const chromeLessons = content.lessons.slice(0, chromeLessonCount)
  const bandLessons = content.lessons.slice(chromeLessonCount)
  return (
    cardWordCountOf(chromeLessons.filter((lesson) => isAdmittedAt(lesson, schoolLevel))) +
    wordsBeyondDrawsOf(
      content,
      bandLessons.filter((lesson) => isAdmittedAt(lesson, schoolLevel)),
    )
  )
}
