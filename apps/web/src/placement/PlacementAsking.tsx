import {
  placementBand,
  placementChoose,
  placementNext,
  placementProgress,
  placementPrompt,
  placementSendBand,
} from '@mygame/catalog'
import type { Placement, PlacementAnswers } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { ChoiceWalk } from '../design-system/ChoiceWalk'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { BandScores } from './BandScores'

type AskingPlacement = Extract<Placement, { readonly kind: 'asking' }>

export interface PlacementAskingProps {
  readonly asking: AskingPlacement
  readonly isSending: boolean
  readonly onSend: (answers: PlacementAnswers) => void
}

export function PlacementAsking({ asking, isSending, onSend }: PlacementAskingProps): ReactElement {
  return (
    <div className="flex flex-col gap-4">
      <BandScores scores={asking.scores} />
      <ChoiceWalk
        items={asking.items}
        lines={{
          heading: lineLabelOf(placementBand({ band: asking.band }), 'es'),
          prompt: lineLabelOf(placementPrompt(), 'es'),
          next: lineLabelOf(placementNext(), 'es'),
          choose: lineLabelOf(placementChoose(), 'es'),
          send: lineLabelOf(placementSendBand({ band: asking.band }), 'es'),
          progressOf: (number, total) => lineLabelOf(placementProgress({ number, total }), 'es'),
        }}
        isSending={isSending}
        onSend={(answers) => onSend({ band: asking.band, answers: [...answers] })}
      />
    </div>
  )
}
