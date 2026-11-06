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
  townNextBuildFactory,
  townNextBuildFarm,
  townNextBuildPowerStation,
  townNextGoToReport,
  townNextLessonReadyIn,
} from '@mygame/catalog'
import type { NextStep } from '@mygame/contracts/town'
import type { SlotCountdown } from '../design-system/CountdownLine'
import { formatQuantity } from '../design-system/formatQuantity'
import { lessonNumberOf } from '../school/lessonCardOf'
import { formatFinish } from '../time/formatFinish'
import type { LiveTown } from './liveTown'

type Step<Kind extends NextStep['kind']> = Extract<NextStep, { readonly kind: Kind }>

type Producer = NonNullable<Step<'lessonRunning'>['producer']>

export type NextStepAction =
  | { readonly label: string; readonly to: '/reviews' | '/school' | '/report' }
  | { readonly label: string; readonly to: '/school/$lessonId'; readonly lessonId: string }

export interface NextStepCardContent {
  readonly line: string
  readonly detail: string | undefined
  readonly countdown: SlotCountdown | undefined
  readonly action: NextStepAction
}

const buildLines: Readonly<Record<Producer, () => string>> = {
  farm: townNextBuildFarm,
  factory: townNextBuildFactory,
  powerStation: townNextBuildPowerStation,
}

const lessonCountdownOf = ({ lessonSlot, overview, at }: LiveTown): SlotCountdown | undefined =>
  lessonSlot === null
    ? undefined
    : {
        words: townNextLessonReadyIn({ number: lessonNumberOf(lessonSlot.lessonId, overview) }),
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

function reviewsCardOf({ count, readFirst }: Step<'reviews'>, town: LiveTown): NextStepCardContent {
  const [firstUnread] = readFirst
  return {
    line: reportReviewsDue({ count: formatQuantity(count) }),
    detail: undefined,
    countdown: lessonCountdownOf(town),
    action:
      firstUnread === undefined
        ? { label: reportStartReviews(), to: '/reviews' }
        : readWords(firstUnread),
  }
}

function lessonRunningCardOf(
  { producer }: Step<'lessonRunning'>,
  town: LiveTown,
): NextStepCardContent {
  return {
    line: schoolSlotTitle(),
    detail: producer === null ? undefined : buildLines[producer](),
    countdown: lessonCountdownOf(town),
    action:
      town.lessonSlot === null
        ? { label: schoolLessonReadWords(), to: '/school' }
        : readWords(town.lessonSlot.lessonId),
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
    case 'lessonRunning':
      return lessonRunningCardOf(nextStep, town)
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
