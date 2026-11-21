import { type DueReview, ReviewAnswerRequestSchema, type ReviewHint } from '@mygame/contracts'
import type { FormEvent, ReactElement, Ref } from 'react'
import type { PlayerCopy } from '../copy/PlayerCopy'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Button } from '../design-system/Button'
import type { Label } from '../design-system/Label'
import { LabelText } from '../design-system/LabelText'
import { TextField } from '../design-system/TextField'
import { CheckAction } from './CheckAction'
import { frameTextOf } from './frameTextOf'
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

type WordHintLine = {
  readonly hintSoFar: string
  readonly line: Label
}

const hintLinesOf = (
  words: ReviewHint['words'],
  fixedCopy: PlayerCopy['fixedCopy'],
): ReadonlyArray<WordHintLine> =>
  words.reduce<ReadonlyArray<WordHintLine>>((lines, word) => {
    const line = fixedCopy((catalog) => catalog.reviewHint(word))
    return lines.concat({ hintSoFar: `${lines.at(-1)?.hintSoFar ?? ''}${line.text}\n`, line })
  }, [])

function HintLine({ review }: { readonly review: ReviewHandle }): ReactElement {
  const { fixedCopy } = usePlayerCopy()
  if (review.hint !== undefined) {
    return (
      <div className="flex flex-col gap-1">
        {hintLinesOf(review.hint.words, fixedCopy).map(({ hintSoFar, line }) => (
          <p key={hintSoFar} className="m-0 font-sans text-body text-ink">
            <LabelText label={line} />
          </p>
        ))}
      </div>
    )
  }
  return (
    <Button
      type="button"
      tone="quiet"
      availability={review.isWaiting ? 'waiting' : 'available'}
      onClick={review.askHint}
    >
      <LabelText label={fixedCopy((catalog) => catalog.reviewAskHint())} />
    </Button>
  )
}

function PendingAnswer({ review }: { readonly review: ReviewHandle }): ReactElement {
  const { fixedCopy } = usePlayerCopy()
  return (
    <>
      {review.isNearMiss && (
        <p
          role="status"
          className="m-0 rounded-md border border-ink bg-surface-sunken px-3 py-2 font-sans text-body text-ink"
        >
          <LabelText label={fixedCopy((catalog) => catalog.reviewNearMiss())} />
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
  const { fixedCopy } = usePlayerCopy()
  const prompt = fixedCopy((catalog) => catalog.reviewRecallPrompt())
  const glossLanguage = prompt.language
  const submit = (event: FormEvent): void => {
    event.preventDefault()
    review.check()
  }
  return (
    <>
      <ReviewBlock
        cue={card.gloss}
        cueLang={glossLanguage}
        frame={frameTextOf(card.gappedFrame)}
        review={review}
      />
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="m-0 font-sans text-caption text-ink-muted">
          <LabelText label={prompt} />
        </p>
        <TextField
          label={fixedCopy((catalog) => catalog.reviewAnswerField())}
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
            rightAnswer={review.answered.verdict.word}
            verdictRef={verdictRef}
            onNext={review.next}
          />
        )}
      </form>
    </>
  )
}
