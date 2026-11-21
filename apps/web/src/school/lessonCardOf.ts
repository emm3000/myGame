import {
  es,
  schoolLessonCapReached,
  schoolLessonNeedsSchool,
  schoolLessonReadWords,
  schoolLessonReward,
  schoolLessonStudy,
  schoolLessonTitle,
  schoolLessonWords,
} from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import type { WordStanding } from '@mygame/domain'
import { type BlockHue, blockHueOf } from '../design-system/blockHueOf'
import type { OrderActionState } from '../design-system/CardAction'
import { lineLabelOf } from '../design-system/lineLabelOf'
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
  readonly title: string
  readonly hue: BlockHue
  readonly theme: string
  readonly wordsLine: string
  readonly skillLine: string
  readonly actionLabel: string
  readonly durationSeconds: number
  readonly standings: ReadonlyArray<WordStanding>
  readonly state: LessonCardState
}

export const readWordsLabelOf = (
  lessonId: string,
  shownLessonId: string,
  overview: TownOverview,
): string =>
  lessonId === shownLessonId
    ? schoolLessonReadWords()
    : `${lessonLinesOf(lessonNameOf(lessonId, overview)).title} · ${schoolLessonReadWords()}`

export const isPastLearningCap = (
  lesson: Pick<Lesson, 'words'>,
  { learning }: TownOverview,
): boolean => learning.inLearning + lesson.words.length > learning.cap

function actionOf(lesson: StudyableLesson, overview: TownOverview): OrderActionState {
  const { lessonSlot, learning, buildings } = overview
  if (lessonSlot !== null) {
    return {
      kind: 'blocked',
      reason: lineLabelOf(
        lessonLinesOf(lessonNameOf(lessonSlot.lessonId, overview)).slotBusy,
        'es',
      ),
    }
  }
  if (buildings.school.level < lesson.requiredSchoolLevel) {
    return {
      kind: 'blocked',
      reason: lineLabelOf(schoolLessonNeedsSchool({ level: lesson.requiredSchoolLevel }), 'es'),
    }
  }
  if (isPastLearningCap(lesson, overview)) {
    return {
      kind: 'blocked',
      reason: lineLabelOf(
        schoolLessonCapReached({
          inLearning: learning.inLearning,
          cap: learning.cap,
          count: lesson.words.length,
        }),
        'es',
      ),
    }
  }
  return { kind: 'affordable' }
}

export function lessonStateOf(lesson: StudyableLesson, overview: TownOverview): LessonCardState {
  if (lesson.isStudied) {
    return { kind: 'studied' }
  }
  if (overview.lessonSlot?.lessonId === lesson.id) {
    return { kind: 'studying' }
  }
  return { kind: 'open', action: actionOf(lesson, overview) }
}

export function lessonCardOf(lesson: Lesson, overview: TownOverview): LessonCardContent {
  const number = lessonNumberOf(lesson.id, overview)
  return {
    lessonId: lesson.id,
    title: schoolLessonTitle({ number }),
    hue: blockHueOf(number - 1),
    theme: lesson.theme,
    wordsLine: schoolLessonWords({ count: lesson.words.length }),
    skillLine: schoolLessonReward({
      percent: lesson.skill.ratePercent,
      resource: townResourceNameOf(es, lesson.skill.resource),
    }),
    actionLabel: schoolLessonStudy({ number }),
    durationSeconds: lesson.durationSeconds,
    standings: lesson.words.map(({ standing }) => standing),
    state: lessonStateOf(lesson, overview),
  }
}
