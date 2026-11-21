import type { Placement, PlacementAnswers } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { ChoiceWalk } from '../design-system/ChoiceWalk'
import type { StepFocus } from '../focus/useStepFocus'
import { BandScores } from './BandScores'

type AskingPlacement = Extract<Placement, { readonly kind: 'asking' }>

export interface PlacementAskingProps {
  readonly asking: AskingPlacement
  readonly word: StepFocus
  readonly isSending: boolean
  readonly onSend: (answers: PlacementAnswers) => void
}

export function PlacementAsking({
  asking,
  word,
  isSending,
  onSend,
}: PlacementAskingProps): ReactElement {
  const { fixedCopy } = usePlayerCopy()
  const prompt = fixedCopy((catalog) => catalog.placementPrompt())
  return (
    <div className="flex flex-col gap-4">
      <BandScores scores={asking.scores} />
      <ChoiceWalk
        items={asking.items}
        lines={{
          heading: fixedCopy((catalog) => catalog.placementBand({ band: asking.band })),
          prompt,
          next: fixedCopy((catalog) => catalog.placementNext()),
          choose: fixedCopy((catalog) => catalog.placementChoose()),
          send: fixedCopy((catalog) => catalog.placementSendBand({ band: asking.band })),
          progressOf: (number, total) =>
            fixedCopy((catalog) => catalog.placementProgress({ number, total })),
        }}
        choiceLanguage={prompt.language}
        word={word}
        isSending={isSending}
        onSend={(answers) => onSend({ band: asking.band, answers: [...answers] })}
      />
    </div>
  )
}
