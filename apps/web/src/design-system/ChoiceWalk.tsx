import {
  placementBand,
  placementChoose,
  placementNext,
  placementProgress,
  placementPrompt,
} from '@mygame/catalog'
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

export interface ChoiceWalkProps {
  readonly band: number
  readonly items: ReadonlyArray<WalkItem>
  readonly sendLabel: string
  readonly isSending: boolean
  readonly onSend: (answers: ReadonlyArray<ChosenAnswer>) => void
}

function Choices({
  item,
  walk,
  isSending,
}: {
  readonly item: WalkItem
  readonly walk: ChoiceWalkState
  readonly isSending: boolean
}): ReactElement {
  return (
    <fieldset disabled={isSending} className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 font-sans text-caption text-ink-muted">{placementPrompt()}</legend>
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
  sendLabel,
  isSending,
  onSend,
  walk,
}: Omit<ChoiceWalkProps, 'band' | 'items'> & { readonly walk: ChoiceWalkState }): ReactElement {
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
          {sendLabel}
        </Button>
      ) : (
        <Button
          type="button"
          tone="primary"
          availability={availability}
          describedBy={isBlocked ? reasonId : undefined}
          onClick={walk.next}
        >
          {placementNext()}
        </Button>
      )}
      {isBlocked && (
        <p id={reasonId} className="m-0 font-sans text-caption text-ink-muted">
          {placementChoose()}
        </p>
      )}
    </div>
  )
}

export function ChoiceWalk(props: ChoiceWalkProps): ReactElement | null {
  const { band, items, isSending } = props
  const walk = useChoiceWalk(items)
  const wordId = useId()
  if (walk.shown === undefined) {
    return null
  }
  return (
    <>
      <div className="flex flex-col gap-2 font-sans">
        <p className="m-0 text-meta text-ink-muted">{placementBand({ band })}</p>
        <p className="m-0 text-caption text-ink-muted">
          {placementProgress({ number: walk.shownIndex + 1, total: items.length })}
        </p>
        <Track value={walk.shownIndex + 1} total={items.length} fillClass="fill-action" />
      </div>
      <Block hue={blockHueOf(walk.shownIndex)} labelledBy={wordId}>
        <h2 id={wordId} lang="en" className="m-0 text-word wrap-anywhere">
          {walk.shown.word}
        </h2>
      </Block>
      <Choices item={walk.shown} walk={walk} isSending={isSending} />
      <WalkAction {...props} walk={walk} />
    </>
  )
}
