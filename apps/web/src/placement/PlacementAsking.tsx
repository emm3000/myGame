import {
  placementBand,
  placementChoose,
  placementNext,
  placementProgress,
  placementPrompt,
  placementSendBand,
} from '@mygame/catalog'
import type { PlacementAnswers } from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import { Block } from '../design-system/Block'
import { Button } from '../design-system/Button'
import { blockHueOf } from '../design-system/blockHueOf'
import { Track } from '../design-system/Track'
import { BandScores } from './BandScores'
import { type AskingPlacement, type BandWalk, type PlacementItem, useBandWalk } from './useBandWalk'

export interface PlacementAskingProps {
  readonly asking: AskingPlacement
  readonly isSending: boolean
  readonly onSend: (answers: PlacementAnswers) => void
}

function Choices({
  item,
  walk,
  isSending,
}: {
  readonly item: PlacementItem
  readonly walk: BandWalk
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
  asking,
  walk,
  isSending,
  onSend,
}: PlacementAskingProps & { readonly walk: BandWalk }): ReactElement {
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
          {placementSendBand({ band: asking.band })}
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

export function PlacementAsking(props: PlacementAskingProps): ReactElement | null {
  const { asking, isSending } = props
  const walk = useBandWalk(asking)
  const wordId = useId()
  if (walk.shown === undefined) {
    return null
  }
  const total = asking.items.length
  return (
    <div className="flex flex-col gap-4">
      <BandScores scores={asking.scores} />
      <div className="flex flex-col gap-2 font-sans">
        <p className="m-0 text-meta text-ink-muted">{placementBand({ band: asking.band })}</p>
        <p className="m-0 text-caption text-ink-muted">
          {placementProgress({ number: walk.shownIndex + 1, total })}
        </p>
        <Track value={walk.shownIndex + 1} total={total} fillClass="fill-action" />
      </div>
      <Block hue={blockHueOf(walk.shownIndex)} labelledBy={wordId}>
        <h2 id={wordId} lang="en" className="m-0 text-word wrap-anywhere">
          {walk.shown.word}
        </h2>
      </Block>
      <Choices item={walk.shown} walk={walk} isSending={isSending} />
      <WalkAction {...props} walk={walk} />
    </div>
  )
}
