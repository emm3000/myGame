import {
  reviewAnswerField,
  reviewAskHint,
  reviewHint,
  reviewNearMiss,
  reviewRecallPrompt,
} from '@mygame/catalog'
import { type DueReview, ReviewAnswerRequestSchema } from '@mygame/contracts'
import type { FormEvent, ReactElement, Ref } from 'react'
import { Button } from '../design-system/Button'
import { TextField } from '../design-system/TextField'
import { CheckAction } from './CheckAction'
import { RatedVerdictLines } from './RatedVerdictLines'
import { ReviewBlock } from './ReviewBlock'
import type { ReviewHandle } from './useReview'

type Recall = Extract<DueReview, { readonly mode: 'recall' }>

const answerMaxLength = ReviewAnswerRequestSchema.shape.answer.maxLength ?? undefined

export interface RecallCardProps {
  readonly card: Recall
  readonly review: ReviewHandle
  readonly verdictRef: Ref<HTMLElement>
}

function HintLine({ review }: { readonly review: ReviewHandle }): ReactElement {
  if (review.hint !== undefined) {
    return (
      <p className="m-0 font-sans text-body text-ink">
        {reviewHint({ firstLetter: review.hint.firstLetter, letterCount: review.hint.letterCount })}
      </p>
    )
  }
  return (
    <Button
      type="button"
      tone="quiet"
      availability={review.isWaiting ? 'waiting' : 'available'}
      onClick={review.askHint}
    >
      {reviewAskHint()}
    </Button>
  )
}

function PendingAnswer({ review }: { readonly review: ReviewHandle }): ReactElement {
  return (
    <>
      {review.isNearMiss && (
        <p
          role="status"
          className="m-0 rounded-md border border-ink bg-surface-sunken px-3 py-2 font-sans text-body text-ink"
        >
          {reviewNearMiss()}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <CheckAction isWaiting={review.isWaiting} isReady={review.typed !== ''} />
        <HintLine review={review} />
      </div>
    </>
  )
}

export function RecallCard({ card, review, verdictRef }: RecallCardProps): ReactElement {
  const submit = (event: FormEvent): void => {
    event.preventDefault()
    review.check()
  }
  return (
    <>
      <ReviewBlock cue={card.gloss} cueLang="es" frame={card.gappedFrame} walked={review.walked} />
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="m-0 font-sans text-caption text-ink-muted">{reviewRecallPrompt()}</p>
        <TextField
          label={reviewAnswerField()}
          name="answer"
          type="text"
          autoComplete="off"
          lang="en"
          value={review.typed}
          maxLength={answerMaxLength}
          onChange={review.type}
          isDisabled={review.answered !== undefined}
        />
        {review.answered === undefined && <PendingAnswer review={review} />}
        {review.answered !== undefined && (
          <RatedVerdictLines
            answered={review.answered}
            answerLang="en"
            verdictRef={verdictRef}
            onNext={review.next}
          />
        )}
      </form>
    </>
  )
}
