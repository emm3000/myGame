import type { Placement, PlacementAnswers } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { ChoiceWalk } from '../design-system/ChoiceWalk'
import { BandScores } from './BandScores'

type AskingPlacement = Extract<Placement, { readonly kind: 'asking' }>

export interface PlacementAskingProps {
  readonly asking: AskingPlacement
  readonly isSending: boolean
  readonly onSend: (answers: PlacementAnswers) => void
}

export function PlacementAsking({ asking, isSending, onSend }: PlacementAskingProps): ReactElement {
  const { fixedCopy } = usePlayerCopy()
  return (
    <div className="flex flex-col gap-4">
      <BandScores scores={asking.scores} />
      <ChoiceWalk
        items={asking.items}
        lines={{
          heading: fixedCopy((catalog) => catalog.placementBand({ band: asking.band })),
          prompt: fixedCopy((catalog) => catalog.placementPrompt()),
          next: fixedCopy((catalog) => catalog.placementNext()),
          choose: fixedCopy((catalog) => catalog.placementChoose()),
          send: fixedCopy((catalog) => catalog.placementSendBand({ band: asking.band })),
          progressOf: (number, total) =>
            fixedCopy((catalog) => catalog.placementProgress({ number, total })),
        }}
        isSending={isSending}
        onSend={(answers) => onSend({ band: asking.band, answers: [...answers] })}
      />
    </div>
  )
}
