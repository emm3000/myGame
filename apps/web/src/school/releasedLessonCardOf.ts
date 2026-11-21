import { schoolLessonWords, schoolReleasedStudy } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import type { WordStanding } from '@mygame/domain'
import { lessonNameOf } from '../town/lessonNameOf'
import { type LessonCardState, lessonStateOf } from './lessonCardOf'
import { lessonLinesOf } from './lessonLinesOf'

type ReleasedLesson = TownOverview['releasedLessons'][number]

export interface ReleasedLessonCardContent {
  readonly lessonId: string
  readonly title: string
  readonly wordsLine: string
  readonly actionLabel: string
  readonly durationSeconds: number
  readonly standings: ReadonlyArray<WordStanding>
  readonly state: LessonCardState
}

export const releasedLessonCardOf = (
  lesson: ReleasedLesson,
  overview: TownOverview,
): ReleasedLessonCardContent => ({
  lessonId: lesson.id,
  title: lessonLinesOf(lessonNameOf(lesson.id, overview)).title,
  wordsLine: schoolLessonWords({ count: lesson.words.length }),
  actionLabel: schoolReleasedStudy(),
  durationSeconds: lesson.durationSeconds,
  standings: lesson.words.map(({ standing }) => standing),
  state: lessonStateOf(lesson, overview),
})
