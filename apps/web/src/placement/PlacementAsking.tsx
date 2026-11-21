import { placementSendBand } from '@mygame/catalog'
import type { Placement, PlacementAnswers } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { ChoiceWalk } from '../design-system/ChoiceWalk'
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
        band={asking.band}
        items={asking.items}
        sendLabel={placementSendBand({ band: asking.band })}
        isSending={isSending}
        onSend={(answers) => onSend({ band: asking.band, answers: [...answers] })}
      />
    </div>
  )
}
