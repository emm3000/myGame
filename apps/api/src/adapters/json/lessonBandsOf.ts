import { type Band, headwordOf, type LessonId } from '@mygame/domain'
import { isUnitLesson } from '../../contentGate/isUnitLesson'
import { bandOfRank } from './bandOfRank'
import type { LessonContentFiles, LessonOfFiles } from './lessonContentFilesOf'

const bandOfTaughtLesson = (
  { content, words }: LessonOfFiles,
  ranks: ReadonlyMap<string, number>,
): Band => {
  const wordRanks = words.flatMap(({ lemma }) => ranks.get(headwordOf(lemma)) ?? [])
  if (wordRanks.length === 0) {
    throw new Error(`Lesson ${content.id} teaches no word of the list`)
  }
  return bandOfRank(Math.min(...wordRanks))
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
