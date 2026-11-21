import type { TownOverview } from '@mygame/contracts'
import type { WordStanding } from '@mygame/domain'
import type { PlayerCopy } from '../copy/PlayerCopy'
import { formatDuration } from '../design-system/formatDuration'
import type { Label } from '../design-system/Label'
import { type LessonCardState, lessonStateOf } from './lessonCardOf'

type ReleasedLesson = TownOverview['releasedLessons'][number]

export interface ReleasedRowContent {
  readonly lessonId: string
  readonly title: Label
  readonly wordsLine: Label
  readonly studyLabel: Label
  readonly standings: ReadonlyArray<WordStanding>
  readonly state: LessonCardState
}

export const releasedRowOf = (
  lesson: ReleasedLesson,
  overview: TownOverview,
  copy: PlayerCopy,
): ReleasedRowContent => {
  const set = { band: lesson.band, number: lesson.position }
  return {
    lessonId: lesson.id,
    title: copy.fixedCopy((catalog) => catalog.schoolReleasedTitle(set)),
    wordsLine: copy.chrome((catalog) => catalog.schoolLessonWords({ count: lesson.words.length })),
    studyLabel: copy.fixedCopy(
      (catalog) =>
        `${catalog.schoolReleasedTitle(set)} · ${catalog.schoolReleasedStudy()} · ${formatDuration(lesson.durationSeconds)}`,
    ),
    standings: lesson.words.map(({ standing }) => standing),
    state: lessonStateOf(lesson, overview, copy),
  }
}
