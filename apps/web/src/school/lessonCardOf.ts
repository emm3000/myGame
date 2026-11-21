import type { TownOverview } from '@mygame/contracts'
import type { WordStanding } from '@mygame/domain'
import type { ChromeCatalog, PlayerCopy } from '../copy/PlayerCopy'
import { type BlockHue, blockHueOf } from '../design-system/blockHueOf'
import type { OrderActionState } from '../design-system/CardAction'
import { formatDuration } from '../design-system/formatDuration'
import type { Label } from '../design-system/Label'
import { townResourceNameOf } from '../resources/townResourceNameOf'
import { lessonNameOf, lessonNumberOf } from '../town/lessonNameOf'
import { lessonLinesOf } from './lessonLinesOf'

type Lesson = TownOverview['lessons'][number]

type StudyableLesson = Pick<Lesson, 'id' | 'isStudied' | 'requiredSchoolLevel' | 'words'>

export type LessonCardState =
  | { readonly kind: 'studied' }
  | { readonly kind: 'studying' }
  | { readonly kind: 'open'; readonly action: OrderActionState }

export interface LessonCardContent {
  readonly lessonId: string
  readonly title: Label
  readonly hue: BlockHue
  readonly theme: string
  readonly detailLine: Label
  readonly studyLabel: Label
  readonly standings: ReadonlyArray<WordStanding>
  readonly state: LessonCardState
}

export const readWordsLabelOf = (
  lessonId: string,
  shownLessonId: string,
  overview: TownOverview,
  copy: PlayerCopy,
): Label => {
  const name = lessonNameOf(lessonId, overview)
  const titleOf = (catalog: ChromeCatalog): string =>
    name.kind === 'shelved'
      ? catalog.schoolLessonTitle({ number: name.number })
      : lessonLinesOf(name, copy).title.text
  return copy.chrome((catalog) =>
    lessonId === shownLessonId
      ? catalog.schoolLessonReadWords()
      : `${titleOf(catalog)} · ${catalog.schoolLessonReadWords()}`,
  )
}

export const isPastLearningCap = (
  lesson: Pick<Lesson, 'words'>,
  { learning }: TownOverview,
): boolean => learning.inLearning + lesson.words.length > learning.cap

function actionOf(
  lesson: StudyableLesson,
  overview: TownOverview,
  copy: PlayerCopy,
): OrderActionState {
  const { lessonSlot, learning, buildings } = overview
  if (lessonSlot !== null) {
    return {
      kind: 'blocked',
      reason: lessonLinesOf(lessonNameOf(lessonSlot.lessonId, overview), copy).slotBusy,
    }
  }
  if (buildings.school.level < lesson.requiredSchoolLevel) {
    return {
      kind: 'blocked',
      reason: copy.chrome((catalog) =>
        catalog.schoolLessonNeedsSchool({ level: lesson.requiredSchoolLevel }),
      ),
    }
  }
  if (isPastLearningCap(lesson, overview)) {
    return {
      kind: 'blocked',
      reason: copy.chrome((catalog) =>
        catalog.schoolLessonCapReached({
          inLearning: learning.inLearning,
          cap: learning.cap,
          count: lesson.words.length,
        }),
      ),
    }
  }
  return { kind: 'affordable' }
}

export function lessonStateOf(
  lesson: StudyableLesson,
  overview: TownOverview,
  copy: PlayerCopy,
): LessonCardState {
  if (lesson.isStudied) {
    return { kind: 'studied' }
  }
  if (overview.lessonSlot?.lessonId === lesson.id) {
    return { kind: 'studying' }
  }
  return { kind: 'open', action: actionOf(lesson, overview, copy) }
}

export function lessonCardOf(
  lesson: Lesson,
  overview: TownOverview,
  copy: PlayerCopy,
): LessonCardContent {
  const number = lessonNumberOf(lesson.id, overview)
  const { skill } = lesson
  return {
    lessonId: lesson.id,
    title: copy.chrome((catalog) => catalog.schoolLessonTitle({ number })),
    hue: blockHueOf(number - 1),
    theme: lesson.theme,
    detailLine: copy.chrome(
      (catalog) =>
        `${catalog.schoolLessonWords({ count: lesson.words.length })} · ${catalog.schoolLessonReward(
          { percent: skill.ratePercent, resource: townResourceNameOf(catalog, skill.resource) },
        )}`,
    ),
    studyLabel: copy.chrome(
      (catalog) =>
        `${catalog.schoolLessonStudy({ number })} · ${formatDuration(lesson.durationSeconds)}`,
    ),
    standings: lesson.words.map(({ standing }) => standing),
    state: lessonStateOf(lesson, overview, copy),
  }
}
