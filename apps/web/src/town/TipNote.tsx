import {
  townTipClose,
  townTipFullStore,
  townTipJobs,
  townTipOffice,
  townTipPeople,
  townTipSeasons,
  townTipTitle,
  townTipWaitingList,
} from '@mygame/catalog'
import type { TipKind } from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import { Button } from '../design-system/Button'

export type TipPlace = 'stocks' | 'work' | 'places' | 'office'

export interface TipNoteProps {
  readonly tip: TipKind | null
  readonly place: TipPlace
  readonly onClose: (tip: TipKind) => void
}

const placeOfTip: Readonly<Record<TipKind, TipPlace>> = {
  seasons: 'stocks',
  fullStore: 'stocks',
  waitingList: 'work',
  people: 'places',
  office: 'office',
  jobs: 'office',
}

const lineOfTip: Readonly<Record<TipKind, () => string>> = {
  people: townTipPeople,
  seasons: townTipSeasons,
  waitingList: townTipWaitingList,
  office: townTipOffice,
  jobs: townTipJobs,
  fullStore: townTipFullStore,
}

export function TipNote({ tip, place, onClose }: TipNoteProps): ReactElement | null {
  const titleId = useId()
  if (tip === null || placeOfTip[tip] !== place) {
    return null
  }
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-1 rounded-md border border-line bg-surface-raised px-5 pt-4 pb-1"
    >
      <h3 id={titleId} className="m-0 font-sans text-meta text-ink-muted">
        {townTipTitle()}
      </h3>
      <p className="m-0 font-sans text-body text-ink">{lineOfTip[tip]()}</p>
      <div>
        <Button type="button" tone="text" onClick={() => onClose(tip)}>
          {townTipClose()}
        </Button>
      </div>
    </section>
  )
}
