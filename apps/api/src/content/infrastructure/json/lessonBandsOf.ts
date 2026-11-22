import { type Band, headwordOf, type LessonId } from '@mygame/domain'
import { bandOfListedRank } from './bandOfListedRank'
import { isUnitLesson } from './isUnitLesson'
import type { LessonContentFiles, LessonOfFiles } from './readLessonContentFiles'

const bandOfTaughtLesson = (
  { content, words }: LessonOfFiles,
  ranks: ReadonlyMap<string, number>,
): Band => {
  const wordRanks = words.flatMap(({ lemma }) => {
    const headword = headwordOf(lemma)
    const rank = ranks.get(headword)
    return rank === undefined ? [] : [{ headword, rank }]
  })
  const [lowest] = wordRanks.toSorted((a, b) => a.rank - b.rank)
  if (lowest === undefined) {
    throw new Error(`Lesson ${content.id} teaches no word of the list`)
  }
  return bandOfListedRank(lowest.headword, lowest.rank)
}

export const lessonBandsOf = ({
  curriculum,
  lessons,
  ranks,
}: LessonContentFiles): ReadonlyMap<LessonId, Band> =>
  new Map(
    lessons
      .slice(curriculum.chromeLessonCount)
      .filter((lesson) => !isUnitLesson(lesson))
      .map((lesson) => [lesson.content.id, bandOfTaughtLesson(lesson, ranks)]),
  )
