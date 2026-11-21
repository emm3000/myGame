import type { NextStep } from '@mygame/contracts'
import type { PlayerCopy } from '../copy/PlayerCopy'
import type { SlotCountdown } from '../design-system/CountdownLine'
import { formatQuantity } from '../design-system/formatQuantity'
import type { Label } from '../design-system/Label'
import { finishTimeOf } from './finishTimeOf'
import { type LessonName, lessonNameOf, lessonNumberOf } from './lessonNameOf'
import type { LiveTown } from './liveTown'

export type Step<Kind extends NextStep['kind']> = Extract<NextStep, { readonly kind: Kind }>

export type NextStepAction =
  | { readonly label: Label; readonly to: '/reviews' | '/school' | '/report' }
  | { readonly label: Label; readonly to: '/school/$lessonId'; readonly lessonId: string }

export interface NextStepCardContent {
  readonly line: Label
  readonly detail: Label | undefined
  readonly countdown: SlotCountdown | undefined
  readonly action: NextStepAction
}

const readyWordsOf = (copy: PlayerCopy, name: LessonName): Label => {
  switch (name.kind) {
    case 'shelved':
      return copy.chrome((catalog) => catalog.townNextLessonReadyIn({ number: name.number }))
    case 'released':
      return copy.fixedCopy((catalog) =>
        catalog.townNextReleasedReadyIn({ band: name.band, number: name.set }),
      )
    default: {
      const unreachable: never = name
      return unreachable
    }
  }
}

export const lessonCountdownOf = (
  copy: PlayerCopy,
  { lessonSlot, overview, at }: LiveTown,
): SlotCountdown | undefined =>
  lessonSlot === null
    ? undefined
    : {
        words: readyWordsOf(copy, lessonNameOf(lessonSlot.lessonId, overview)),
        time: finishTimeOf(copy, lessonSlot.remainingSeconds, at),
      }

const nextReviewCountdownOf = (
  copy: PlayerCopy,
  { nextDueSeconds, at }: LiveTown,
): SlotCountdown | undefined =>
  nextDueSeconds === null
    ? undefined
    : {
        words: copy.chrome((catalog) => catalog.reviewNextReview()),
        time: finishTimeOf(copy, nextDueSeconds, at),
      }

const readWords = (copy: PlayerCopy, lessonId: string): NextStepAction => ({
  label: copy.chrome((catalog) => catalog.schoolLessonReadWords()),
  to: '/school/$lessonId',
  lessonId,
})

const goToSchool = (copy: PlayerCopy): NextStepAction => ({
  label: copy.chrome((catalog) => catalog.townGoToSchool()),
  to: '/school',
})

export const reviewsActionOf = (
  copy: PlayerCopy,
  [firstUnread]: ReadonlyArray<string>,
): NextStepAction =>
  firstUnread === undefined
    ? { label: copy.chrome((catalog) => catalog.reportStartReviews()), to: '/reviews' }
    : readWords(copy, firstUnread)

const reviewsCardOf = (
  copy: PlayerCopy,
  { count, readFirst }: Step<'reviews'>,
  town: LiveTown,
): NextStepCardContent => ({
  line: copy.chrome((catalog) => catalog.reportReviewsDue({ count: formatQuantity(count) })),
  detail: undefined,
  countdown: lessonCountdownOf(copy, town),
  action: reviewsActionOf(copy, readFirst),
})

const runningLessonActionOf = (copy: PlayerCopy, { lessonSlot }: LiveTown): NextStepAction =>
  lessonSlot === null
    ? { label: copy.chrome((catalog) => catalog.schoolLessonReadWords()), to: '/school' }
    : readWords(copy, lessonSlot.lessonId)

const lessonRunningCardOf = (copy: PlayerCopy, town: LiveTown): NextStepCardContent => ({
  line: copy.chrome((catalog) => catalog.schoolSlotTitle()),
  detail: undefined,
  countdown: lessonCountdownOf(copy, town),
  action: runningLessonActionOf(copy, town),
})

function lessonToStudyCardOf(
  copy: PlayerCopy,
  { lessonId }: Step<'lessonToStudy'>,
  town: LiveTown,
): NextStepCardContent {
  const number = lessonNumberOf(lessonId, town.overview)
  const wordCount = town.overview.lessons.find(({ id }) => id === lessonId)?.words.length ?? 0
  return {
    line: copy.chrome((catalog) => catalog.schoolLessonTitle({ number })),
    detail: copy.chrome((catalog) => catalog.schoolLessonWords({ count: wordCount })),
    countdown: nextReviewCountdownOf(copy, town),
    action: {
      label: copy.chrome((catalog) => catalog.schoolLessonStudy({ number })),
      to: '/school',
    },
  }
}

const holdoutCheckCardOf = (
  copy: PlayerCopy,
  { band }: Step<'holdoutCheck'>,
): NextStepCardContent => ({
  line: copy.fixedCopy((catalog) => catalog.townNextHoldoutCheck({ band })),
  detail: undefined,
  countdown: undefined,
  action: goToSchool(copy),
})

const releasedLessonCardOf = (
  copy: PlayerCopy,
  { band, position }: Step<'releasedLesson'>,
  town: LiveTown,
): NextStepCardContent => ({
  line: copy.fixedCopy((catalog) => catalog.townNextReleasedLesson({ band, number: position })),
  detail: undefined,
  countdown: nextReviewCountdownOf(copy, town),
  action: goToSchool(copy),
})

const caughtUpCardOf = (copy: PlayerCopy, town: LiveTown): NextStepCardContent => ({
  line: copy.chrome((catalog) => catalog.reportNoReviewsDue()),
  detail: undefined,
  countdown: nextReviewCountdownOf(copy, town),
  action: { label: copy.chrome((catalog) => catalog.townNextGoToReport()), to: '/report' },
})

export function nextStepCardOf(copy: PlayerCopy, town: LiveTown): NextStepCardContent {
  const { nextStep } = town.overview
  switch (nextStep.kind) {
    case 'reviews':
      return reviewsCardOf(copy, nextStep, town)
    case 'holdoutCheck':
      return holdoutCheckCardOf(copy, nextStep)
    case 'lessonRunning':
      return lessonRunningCardOf(copy, town)
    case 'releasedLesson':
      return releasedLessonCardOf(copy, nextStep, town)
    case 'lessonToStudy':
      return lessonToStudyCardOf(copy, nextStep, town)
    case 'caughtUp':
      return caughtUpCardOf(copy, town)
    default: {
      const unreachable: never = nextStep
      return unreachable
    }
  }
}
