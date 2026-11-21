import type { DueReview } from '@mygame/contracts'
import { Fragment, type ReactElement, type Ref, useEffect, useId } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { FormAlert } from '../design-system/FormAlert'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { formatQuantity } from '../design-system/formatQuantity'
import type { Label } from '../design-system/Label'
import { LabelText } from '../design-system/LabelText'
import { LiveRegion } from '../design-system/LiveRegion'
import { LoadingSkeleton, type LoadingSkeletonProps } from '../design-system/LoadingSkeleton'
import { ReadFailed } from '../design-system/ReadFailed'
import { spokenLineOf } from '../design-system/spokenLineOf'
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
      readonly nextReview: Label
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
  const { chrome, fixedCopy } = usePlayerCopy()
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
  const { refusal } = review
  const dueLine = chrome((catalog) =>
    catalog.reviewDueCount({ count: formatQuantity(state.dueCount) }),
  )
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 font-sans text-caption text-ink-muted">
        <LabelText label={dueLine} />
      </p>
      <Track
        value={review.walked + (hasAnswered ? 1 : 0)}
        total={review.walked + state.dueCount}
        fillClass="fill-action"
      />
      <CardOfMode card={card} review={review} verdictRef={verdictRef} />
      <LiveRegion line={review.isDealt ? spokenLineOf(dueLine) : ''} sequence={review.walked} />
      {refusal !== undefined && (
        <FormAlert message={fixedCopy((catalog) => refusalLineOf(catalog, refusal))} />
      )}
    </div>
  )
}

function ReviewBody({
  state,
  onNext,
}: {
  readonly state: ReviewScreenState
  readonly onNext: () => void
}): ReactElement | null {
  const { chrome } = usePlayerCopy()
  switch (state.kind) {
    case 'loading':
      return null
    case 'failed':
      return (
        <ReadFailed
          message={chrome((catalog) => catalog.reviewFailed())}
          retryLabel={chrome((catalog) => catalog.reviewRetry())}
          onRetry={state.onRetry}
        />
      )
    case 'noCards':
      return (
        <ReviewEnd
          line={chrome((catalog) => catalog.reviewNoCards())}
          nextReview={undefined}
          path={undefined}
        />
      )
    case 'nothingDue':
      return (
        <ReviewEnd
          line={chrome((catalog) => catalog.reviewNothingDue())}
          nextReview={state.nextReview}
          path={state.path}
        />
      )
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

const reviewSkeletonGroups: LoadingSkeletonProps['groups'] = [
  ['control', 'place-card', 'thumbnail', 'action'],
]

export function ReviewScreen({ state }: { readonly state: ReviewScreenState }): ReactElement {
  const title = useFocusTarget<HTMLHeadingElement>()
  const titleId = useId()
  const { chrome } = usePlayerCopy()
  return (
    <section aria-labelledby={titleId} className="mx-auto flex w-full max-w-form flex-col gap-6">
      <h1
        id={titleId}
        ref={title.ref}
        tabIndex={-1}
        className={`m-0 font-sans text-display text-ink ${focusTargetClass}`}
      >
        <LabelText label={chrome((catalog) => catalog.reviewTitle())} />
      </h1>
      <LoadingSkeleton
        isLoading={state.kind === 'loading'}
        line={chrome((catalog) => catalog.reviewLoading())}
        groups={reviewSkeletonGroups}
        Frame={Fragment}
      >
        <ReviewBody state={state} onNext={title.focus} />
      </LoadingSkeleton>
    </section>
  )
}
