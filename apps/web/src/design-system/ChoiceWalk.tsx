import { type ReactElement, useId } from 'react'
import { Block } from './Block'
import { Button } from './Button'
import { blockHueOf } from './blockHueOf'
import { Track } from './Track'
import {
  type ChoiceWalkState,
  type ChosenAnswer,
  useChoiceWalk,
  type WalkItem,
} from './useChoiceWalk'

export interface ChoiceWalkLines {
  readonly heading: string
  readonly prompt: string
  readonly next: string
  readonly choose: string
  readonly send: string
  readonly progressOf: (number: number, total: number) => string
}

export interface ChoiceWalkProps {
  readonly items: ReadonlyArray<WalkItem>
  readonly lines: ChoiceWalkLines
  readonly isSending: boolean
  readonly onSend: (answers: ReadonlyArray<ChosenAnswer>) => void
}

function Choices({
  item,
  walk,
  prompt,
  isSending,
}: {
  readonly item: WalkItem
  readonly walk: ChoiceWalkState
  readonly prompt: string
  readonly isSending: boolean
}): ReactElement {
  return (
    <fieldset disabled={isSending} className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 font-sans text-caption text-ink-muted">{prompt}</legend>
      {item.choices.map((choice) => (
        <label
          key={choice.choiceId}
          lang="es"
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
          {choice.gloss}
        </label>
      ))}
    </fieldset>
  )
}

function WalkAction({
  lines,
  isSending,
  onSend,
  walk,
}: Omit<ChoiceWalkProps, 'items'> & { readonly walk: ChoiceWalkState }): ReactElement {
  const reasonId = useId()
  const isBlocked = walk.chosenForShown === undefined
  const availability = isBlocked ? 'blocked' : 'available'
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
          {lines.send}
        </Button>
      ) : (
        <Button
          type="button"
          tone="primary"
          availability={availability}
          describedBy={isBlocked ? reasonId : undefined}
          onClick={walk.next}
        >
          {lines.next}
        </Button>
      )}
      {isBlocked && (
        <p id={reasonId} className="m-0 font-sans text-caption text-ink-muted">
          {lines.choose}
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
      {lines.send}
    </Button>
  )
}

export function ChoiceWalk(props: ChoiceWalkProps): ReactElement {
  const { items, lines, isSending } = props
  const walk = useChoiceWalk(items)
  const wordId = useId()
  if (walk.shown === undefined) {
    return <EmptyWalk {...props} />
  }
  return (
    <>
      <div className="flex flex-col gap-2 font-sans">
        <p className="m-0 text-meta text-ink-muted">{lines.heading}</p>
        <p className="m-0 text-caption text-ink-muted">
          {lines.progressOf(walk.shownIndex + 1, items.length)}
        </p>
        <Track value={walk.shownIndex + 1} total={items.length} fillClass="fill-action" />
      </div>
      <Block hue={blockHueOf(walk.shownIndex)} labelledBy={wordId}>
        <h2 id={wordId} lang="en" className="m-0 text-word wrap-anywhere">
          {walk.shown.word}
        </h2>
      </Block>
      <Choices item={walk.shown} walk={walk} prompt={lines.prompt} isSending={isSending} />
      <WalkAction {...props} walk={walk} />
    </>
  )
}
