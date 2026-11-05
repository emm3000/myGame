import {
  reviewDueCount,
  reviewFailed,
  reviewLoading,
  reviewNextReview,
  reviewNoCards,
  reviewNothingDue,
  reviewRetry,
  reviewTitle,
} from '@mygame/catalog'
import { type ReactElement, type Ref, useEffect, useId } from 'react'
import { Button } from '../design-system/Button'
import { CountdownLine } from '../design-system/CountdownLine'
import { FormAlert } from '../design-system/FormAlert'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { Panel } from '../design-system/Panel'
import { useFocusTarget } from '../focus/useFocusTarget'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { RecallCard } from './RecallCard'
import { RecognitionCard } from './RecognitionCard'
import type { DueReview, ReviewHandle } from './useReview'

export type ReviewScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed'; readonly onRetry: () => void }
  | { readonly kind: 'noCards' }
  | { readonly kind: 'nothingDue'; readonly nextReview: string | undefined }
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
    <div className="flex max-w-form flex-col gap-3">
      <p className="m-0 font-utility text-label uppercase text-ink-muted">
        {reviewDueCount({ count: state.dueCount })}
      </p>
      <Panel element="article" toneClass="bg-surface-raised" spacingClass="gap-4 p-5">
        <CardOfMode card={card} review={review} verdictRef={verdictRef} />
      </Panel>
      {review.refusal !== undefined && <FormAlert message={refusalLineOf(review.refusal)} />}
    </div>
  )
}

function NothingDue({ nextReview }: { readonly nextReview: string | undefined }): ReactElement {
  return (
    <div className="flex max-w-form flex-col gap-2 rounded-md border border-line border-dashed p-5">
      <p className="m-0 font-body text-body text-ink">{reviewNothingDue()}</p>
      {nextReview !== undefined && <CountdownLine words={reviewNextReview()} time={nextReview} />}
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
        <div className="flex flex-col items-start gap-3">
          <FormAlert message={reviewFailed()} />
          <Button type="button" tone="quiet" onClick={state.onRetry}>
            {reviewRetry()}
          </Button>
        </div>
      )
    case 'noCards':
      return (
        <p className="m-0 max-w-form rounded-md border border-line border-dashed p-5 text-ink">
          {reviewNoCards()}
        </p>
      )
    case 'nothingDue':
      return <NothingDue nextReview={state.nextReview} />
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
    <section aria-labelledby={titleId} className="flex flex-col gap-6">
      <h2
        id={titleId}
        ref={title.ref}
        tabIndex={-1}
        className={`m-0 font-display text-title text-ink ${focusTargetClass}`}
      >
        {reviewTitle()}
      </h2>
      <ReviewBody state={state} onNext={title.focus} />
    </section>
  )
}
