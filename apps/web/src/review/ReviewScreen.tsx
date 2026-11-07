import {
  reviewDueCount,
  reviewFailed,
  reviewLoading,
  reviewNoCards,
  reviewNothingDue,
  reviewRetry,
  reviewTitle,
} from '@mygame/catalog'
import type { DueReview } from '@mygame/contracts'
import { type ReactElement, type Ref, useEffect, useId } from 'react'
import { FormAlert } from '../design-system/FormAlert'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { formatQuantity } from '../design-system/formatQuantity'
import { LiveRegion } from '../design-system/LiveRegion'
import { ReadFailed } from '../design-system/ReadFailed'
import { Track } from '../design-system/Track'
import { useFocusTarget } from '../focus/useFocusTarget'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { LessonReady } from './LessonReady'
import { RecallCard } from './RecallCard'
import { RecognitionCard } from './RecognitionCard'
import { ReviewEnd, type ReviewEndPath } from './ReviewEnd'
import type { ReviewHandle } from './useReview'

export type ReviewScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed'; readonly onRetry: () => void }
  | { readonly kind: 'noCards' }
  | {
      readonly kind: 'nothingDue'
      readonly nextReview: string
      readonly path: ReviewEndPath | undefined
    }
  | {
      readonly kind: 'lessonReady'
      readonly lessonId: string
      readonly lessonNumber: number | undefined
    }
  | {
      readonly kind: 'card'
      readonly card: DueReview
      readonly dueCount: number
      readonly review: ReviewHandle
    }

type CardState = Extract<ReviewScreenState, { readonly kind: 'card' }>

function CardOfMode({
  card,
  ...props
}: {
  readonly card: DueReview
  readonly review: ReviewHandle
  readonly verdictRef: Ref<HTMLElement>
}): ReactElement {
  if (card.mode === 'recognition') {
    return <RecognitionCard card={card} {...props} />
  }
  return <RecallCard card={card} {...props} />
}

function DueCard({
  state,
  onNext,
}: {
  readonly state: CardState
  readonly onNext: () => void
}): ReactElement {
  const { card } = state
  const verdict = useFocusTarget<HTMLElement>()
  const hasAnswered = state.review.answered !== undefined
  const focusVerdict = verdict.focus
  useEffect(() => {
    if (hasAnswered) {
      focusVerdict()
    }
  }, [hasAnswered, focusVerdict])
  const review = {
    ...state.review,
    next: () => {
      state.review.next()
      onNext()
    },
  }
  const verdictRef = verdict.ref
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 font-sans text-caption text-ink-muted">
        {reviewDueCount({ count: formatQuantity(state.dueCount) })}
      </p>
      <Track
        value={review.walked + (hasAnswered ? 1 : 0)}
        total={review.walked + state.dueCount}
        fillClass="fill-action"
      />
      <CardOfMode card={card} review={review} verdictRef={verdictRef} />
      <LiveRegion
        line={review.isDealt ? reviewDueCount({ count: formatQuantity(state.dueCount) }) : ''}
        sequence={review.walked}
      />
      {review.refusal !== undefined && <FormAlert message={refusalLineOf(review.refusal)} />}
    </div>
  )
}

function ReviewBody({
  state,
  onNext,
}: {
  readonly state: ReviewScreenState
  readonly onNext: () => void
}): ReactElement {
  switch (state.kind) {
    case 'loading':
      return <p className="m-0">{reviewLoading()}</p>
    case 'failed':
      return (
        <ReadFailed message={reviewFailed()} retryLabel={reviewRetry()} onRetry={state.onRetry} />
      )
    case 'noCards':
      return <ReviewEnd line={reviewNoCards()} nextReview={undefined} path={undefined} />
    case 'nothingDue':
      return <ReviewEnd line={reviewNothingDue()} nextReview={state.nextReview} path={state.path} />
    case 'lessonReady':
      return <LessonReady lessonId={state.lessonId} lessonNumber={state.lessonNumber} />
    case 'card':
      return <DueCard state={state} onNext={onNext} />
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

export function ReviewScreen({ state }: { readonly state: ReviewScreenState }): ReactElement {
  const title = useFocusTarget<HTMLHeadingElement>()
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="mx-auto flex w-full max-w-form flex-col gap-6">
      <h1
        id={titleId}
        ref={title.ref}
        tabIndex={-1}
        className={`m-0 font-sans text-display text-ink ${focusTargetClass}`}
      >
        {reviewTitle()}
      </h1>
      <ReviewBody state={state} onNext={title.focus} />
    </section>
  )
}
