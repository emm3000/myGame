import { reviewRecognitionPrompt } from '@mygame/catalog'
import type { DueReview } from '@mygame/contracts'
import type { FormEvent, ReactElement, Ref } from 'react'
import { CheckAction } from './CheckAction'
import { frameTextOf } from './frameTextOf'
import { RatedVerdictLines } from './RatedVerdictLines'
import { ReviewBlock } from './ReviewBlock'
import type { ReviewHandle } from './useReview'

type Recognition = Extract<DueReview, { readonly mode: 'recognition' }>

export interface RecognitionCardProps {
  readonly card: Recognition
  readonly review: ReviewHandle
  readonly verdictRef: Ref<HTMLElement>
}

export function RecognitionCard({ card, review, verdictRef }: RecognitionCardProps): ReactElement {
  const submit = (event: FormEvent): void => {
    event.preventDefault()
    review.check()
  }
  return (
    <>
      <ReviewBlock cue={card.word} cueLang="en" frame={frameTextOf(card.frame)} review={review} />
      <form onSubmit={submit} className="flex flex-col gap-4">
        <fieldset
          disabled={review.answered !== undefined}
          className="m-0 flex flex-col gap-2 border-0 p-0"
        >
          <legend className="mb-2 font-sans text-caption text-ink-muted">
            {reviewRecognitionPrompt()}
          </legend>
          {card.choices.map((choice) => (
            <label
              key={choice.choiceId}
              lang="es"
              className="flex min-h-secondary cursor-pointer items-center gap-3 rounded-md border border-line-strong bg-surface px-3 py-2 font-sans text-gloss text-ink has-checked:border-action has-checked:font-bold"
            >
              <input
                type="radio"
                name={card.wordId}
                value={choice.choiceId}
                checked={review.choice?.choiceId === choice.choiceId}
                onChange={() => review.choose(choice)}
                className="size-icon accent-action"
              />
              {choice.gloss}
            </label>
          ))}
        </fieldset>
        {review.answered === undefined && (
          <CheckAction isWaiting={review.isWaiting} isReady={review.choice !== undefined} />
        )}
        {review.answered !== undefined && (
          <RatedVerdictLines
            answered={review.answered}
            answerLang="es"
            verdictRef={verdictRef}
            onNext={review.next}
          />
        )}
      </form>
    </>
  )
}
