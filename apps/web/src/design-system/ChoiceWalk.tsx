import { type ReactElement, useId } from 'react'
import type { StepFocus } from '../focus/useStepFocus'
import { Block } from './Block'
import { Button } from './Button'
import { blockHueOf } from './blockHueOf'
import { blockFocusTargetClass } from './focusTargetClass'
import type { Label, LineLanguage } from './Label'
import { LabelText } from './LabelText'
import { Track } from './Track'
import {
  type ChoiceWalkState,
  type ChosenAnswer,
  useChoiceWalk,
  type WalkItem,
} from './useChoiceWalk'

export interface ChoiceWalkLines {
  readonly heading: Label
  readonly prompt: Label
  readonly next: Label
  readonly choose: Label
  readonly send: Label
  readonly progressOf: (number: number, total: number) => Label
}

export interface ChoiceWalkProps {
  readonly items: ReadonlyArray<WalkItem>
  readonly lines: ChoiceWalkLines
  readonly choiceLanguage: LineLanguage
  readonly word: StepFocus
  readonly isSending: boolean
  readonly onSend: (answers: ReadonlyArray<ChosenAnswer>) => void
}

function Choices({
  item,
  walk,
  prompt,
  choiceLanguage,
  isSending,
}: {
  readonly item: WalkItem
  readonly walk: ChoiceWalkState
  readonly prompt: Label
  readonly choiceLanguage: LineLanguage
  readonly isSending: boolean
}): ReactElement {
  return (
    <fieldset disabled={isSending} className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 font-sans text-caption text-ink-muted">
        <LabelText label={prompt} />
      </legend>
      {item.choices.map((choice) => (
        <label
          key={choice.choiceId}
          className="flex min-h-secondary cursor-pointer items-center gap-3 rounded-md border border-line-strong bg-surface px-3 py-2 font-sans text-gloss text-ink has-checked:border-action has-checked:font-bold"
        >
          <input
            type="radio"
            name={item.wordId}
            value={choice.choiceId}
            checked={walk.chosenForShown === choice.choiceId}
            onChange={() => walk.choose(choice.choiceId)}
            className="size-icon accent-action"
          />
          <span lang={choiceLanguage}>{choice.gloss}</span>
        </label>
      ))}
    </fieldset>
  )
}

function WalkAction({
  lines,
  word,
  isSending,
  onSend,
  walk,
}: Omit<ChoiceWalkProps, 'items'> & { readonly walk: ChoiceWalkState }): ReactElement {
  const reasonId = useId()
  const isBlocked = walk.chosenForShown === undefined
  const availability = isBlocked ? 'blocked' : 'available'
  const showNext = (): void => {
    walk.next()
    word.focus()
  }
  const send = (): void => {
    const answers = walk.answers()
    if (answers !== undefined) {
      onSend(answers)
    }
  }
  return (
    <div className="flex flex-col gap-2">
      {walk.isLastShown ? (
        <Button
          type="button"
          tone="primary"
          availability={isSending ? 'waiting' : availability}
          describedBy={isBlocked ? reasonId : undefined}
          onClick={send}
        >
          <LabelText label={lines.send} />
        </Button>
      ) : (
        <Button
          type="button"
          tone="primary"
          availability={availability}
          describedBy={isBlocked ? reasonId : undefined}
          onClick={showNext}
        >
          <LabelText label={lines.next} />
        </Button>
      )}
      {isBlocked && (
        <p id={reasonId} className="m-0 font-sans text-caption text-ink-muted">
          <LabelText label={lines.choose} />
        </p>
      )}
    </div>
  )
}

function EmptyWalk({ lines, isSending, onSend }: Omit<ChoiceWalkProps, 'items'>): ReactElement {
  return (
    <Button
      type="button"
      tone="primary"
      availability={isSending ? 'waiting' : 'available'}
      onClick={() => onSend([])}
    >
      <LabelText label={lines.send} />
    </Button>
  )
}

export function ChoiceWalk(props: ChoiceWalkProps): ReactElement {
  const { items, lines, choiceLanguage, word, isSending } = props
  const walk = useChoiceWalk(items)
  const wordId = useId()
  if (walk.shown === undefined) {
    return <EmptyWalk {...props} />
  }
  return (
    <>
      <div className="flex flex-col gap-2 font-sans">
        <p className="m-0 text-meta text-ink-muted">
          <LabelText label={lines.heading} />
        </p>
        <p className="m-0 text-caption text-ink-muted">
          <LabelText label={lines.progressOf(walk.shownIndex + 1, items.length)} />
        </p>
        <Track value={walk.shownIndex + 1} total={items.length} fillClass="fill-action" />
      </div>
      <Block hue={blockHueOf(walk.shownIndex)} labelledBy={wordId}>
        <h2
          id={wordId}
          ref={word.ref}
          tabIndex={-1}
          lang="en"
          className={`m-0 text-word wrap-anywhere ${blockFocusTargetClass}`}
        >
          {walk.shown.word}
        </h2>
      </Block>
      <Choices
        item={walk.shown}
        walk={walk}
        prompt={lines.prompt}
        choiceLanguage={choiceLanguage}
        isSending={isSending}
      />
      <WalkAction {...props} walk={walk} />
    </>
  )
}
