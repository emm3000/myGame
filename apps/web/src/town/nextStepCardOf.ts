import {
  reportNoReviewsDue,
  reportReviewsDue,
  reportStartReviews,
  reviewNextReview,
  schoolLessonReadWords,
  schoolLessonStudy,
  schoolLessonTitle,
  schoolLessonWords,
  schoolSlotTitle,
  townGoToSchool,
  townNextGoToReport,
  townNextHoldoutCheck,
  townNextLessonReadyIn,
  townNextReleasedLesson,
  townNextReleasedReadyIn,
} from '@mygame/catalog'
import type { NextStep } from '@mygame/contracts'
import type { SlotCountdown } from '../design-system/CountdownLine'
import { formatQuantity } from '../design-system/formatQuantity'
import { lessonNumberOf } from '../school/lessonCardOf'
import { formatFinish } from '../time/formatFinish'
import { type LessonName, lessonNameOf } from './lessonNameOf'
import type { LiveTown } from './liveTown'

type Step<Kind extends NextStep['kind']> = Extract<NextStep, { readonly kind: Kind }>

export type NextStepAction =
  | { readonly label: string; readonly to: '/reviews' | '/school' | '/report' }
  | { readonly label: string; readonly to: '/school/$lessonId'; readonly lessonId: string }

export interface NextStepCardContent {
  readonly line: string
  readonly detail: string | undefined
  readonly countdown: SlotCountdown | undefined
  readonly action: NextStepAction
}

const readyWordsOf = (name: LessonName): string => {
  switch (name.kind) {
    case 'shelved':
      return townNextLessonReadyIn({ number: name.number })
    case 'released':
      return townNextReleasedReadyIn({ band: name.band, number: name.set })
    default: {
      const unreachable: never = name
      return unreachable
    }
  }
}

export const lessonCountdownOf = ({
  lessonSlot,
  overview,
  at,
}: LiveTown): SlotCountdown | undefined =>
  lessonSlot === null
    ? undefined
    : {
        words: readyWordsOf(lessonNameOf(lessonSlot.lessonId, overview)),
        time: formatFinish(lessonSlot.remainingSeconds, at),
      }

const nextReviewCountdownOf = ({ nextDueSeconds, at }: LiveTown): SlotCountdown | undefined =>
  nextDueSeconds === null
    ? undefined
    : { words: reviewNextReview(), time: formatFinish(nextDueSeconds, at) }

const readWords = (lessonId: string): NextStepAction => ({
  label: schoolLessonReadWords(),
  to: '/school/$lessonId',
  lessonId,
})

export const reviewsActionOf = ([firstUnread]: ReadonlyArray<string>): NextStepAction =>
  firstUnread === undefined
    ? { label: reportStartReviews(), to: '/reviews' }
    : readWords(firstUnread)

function reviewsCardOf({ count, readFirst }: Step<'reviews'>, town: LiveTown): NextStepCardContent {
  return {
    line: reportReviewsDue({ count: formatQuantity(count) }),
    detail: undefined,
    countdown: lessonCountdownOf(town),
    action: reviewsActionOf(readFirst),
  }
}

const runningLessonActionOf = ({ lessonSlot, overview }: LiveTown): NextStepAction => {
  if (lessonSlot === null) {
    return { label: schoolLessonReadWords(), to: '/school' }
  }
  const name = lessonNameOf(lessonSlot.lessonId, overview)
  return name.kind === 'released'
    ? { label: townGoToSchool(), to: '/school' }
    : readWords(lessonSlot.lessonId)
}

function lessonRunningCardOf(town: LiveTown): NextStepCardContent {
  return {
    line: schoolSlotTitle(),
    detail: undefined,
    countdown: lessonCountdownOf(town),
    action: runningLessonActionOf(town),
  }
}

function lessonToStudyCardOf(
  { lessonId }: Step<'lessonToStudy'>,
  town: LiveTown,
): NextStepCardContent {
  const number = lessonNumberOf(lessonId, town.overview)
  const wordCount = town.overview.lessons.find(({ id }) => id === lessonId)?.words.length ?? 0
  return {
    line: schoolLessonTitle({ number }),
    detail: schoolLessonWords({ count: wordCount }),
    countdown: nextReviewCountdownOf(town),
    action: { label: schoolLessonStudy({ number }), to: '/school' },
  }
}

const holdoutCheckCardOf = ({ band }: Step<'holdoutCheck'>): NextStepCardContent => ({
  line: townNextHoldoutCheck({ band }),
  detail: undefined,
  countdown: undefined,
  action: { label: townGoToSchool(), to: '/school' },
})

const releasedLessonCardOf = (
  { band, position }: Step<'releasedLesson'>,
  town: LiveTown,
): NextStepCardContent => ({
  line: townNextReleasedLesson({ band, number: position }),
  detail: undefined,
  countdown: nextReviewCountdownOf(town),
  action: { label: townGoToSchool(), to: '/school' },
})

const caughtUpCardOf = (town: LiveTown): NextStepCardContent => ({
  line: reportNoReviewsDue(),
  detail: undefined,
  countdown: nextReviewCountdownOf(town),
  action: { label: townNextGoToReport(), to: '/report' },
})

export function nextStepCardOf(town: LiveTown): NextStepCardContent {
  const { nextStep } = town.overview
  switch (nextStep.kind) {
    case 'reviews':
      return reviewsCardOf(nextStep, town)
    case 'holdoutCheck':
      return holdoutCheckCardOf(nextStep)
    case 'lessonRunning':
      return lessonRunningCardOf(town)
    case 'releasedLesson':
      return releasedLessonCardOf(nextStep, town)
    case 'lessonToStudy':
      return lessonToStudyCardOf(nextStep, town)
    case 'caughtUp':
      return caughtUpCardOf(town)
    default: {
      const unreachable: never = nextStep
      return unreachable
    }
  }
}
