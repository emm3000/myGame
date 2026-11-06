import {
  schoolLessonCapReached,
  schoolLessonNeedsSchool,
  schoolLessonSlotBusy,
  schoolLessonStudy,
  schoolLessonTitle,
  schoolLessonWords,
  schoolSkillRate,
} from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts/town'
import { type BlockHue, blockHueOf } from '../design-system/blockClassOf'
import type { OrderActionState } from '../design-system/CardAction'
import { townResourceNameOf } from '../resources/townResourceNameOf'

type Lesson = TownOverview['lessons'][number]

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
  readonly state: LessonCardState
}

export const lessonNumberOf = (lessonId: string, overview: TownOverview): number =>
  overview.lessons.findIndex(({ id }) => id === lessonId) + 1

export const isPastLearningCap = (lesson: Lesson, { learning }: TownOverview): boolean =>
  learning.inLearning + lesson.words.length > learning.cap

function actionOf(lesson: Lesson, overview: TownOverview): OrderActionState {
  const { lessonSlot, learning, buildings } = overview
  if (lessonSlot !== null) {
    return {
      kind: 'blocked',
      reason: schoolLessonSlotBusy({ number: lessonNumberOf(lessonSlot.lessonId, overview) }),
    }
  }
  if (buildings.school.level < lesson.requiredSchoolLevel) {
    return {
      kind: 'blocked',
      reason: schoolLessonNeedsSchool({ level: lesson.requiredSchoolLevel }),
    }
  }
  if (isPastLearningCap(lesson, overview)) {
    return {
      kind: 'blocked',
      reason: schoolLessonCapReached({
        inLearning: learning.inLearning,
        cap: learning.cap,
        count: lesson.words.length,
      }),
    }
  }
  return { kind: 'affordable' }
}

function stateOf(lesson: Lesson, overview: TownOverview): LessonCardState {
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
    skillLine: schoolSkillRate({
      percent: lesson.skill.ratePercent,
      resource: townResourceNameOf(lesson.skill.resource),
    }),
    actionLabel: schoolLessonStudy({ number }),
    durationSeconds: lesson.durationSeconds,
    state: stateOf(lesson, overview),
  }
}
