import type { TipKind } from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import type { ChromeCatalog } from '../copy/PlayerCopy'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Button } from '../design-system/Button'
import { LabelText } from '../design-system/LabelText'

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

const lineOfTip: Readonly<Record<TipKind, (catalog: ChromeCatalog) => string>> = {
  people: (catalog) => catalog.townTipPeople(),
  seasons: (catalog) => catalog.townTipSeasons(),
  waitingList: (catalog) => catalog.townTipWaitingList(),
  office: (catalog) => catalog.townTipOffice(),
  jobs: (catalog) => catalog.townTipJobs(),
  fullStore: (catalog) => catalog.townTipFullStore(),
}

export function TipNote({ tip, place, onClose }: TipNoteProps): ReactElement | null {
  const titleId = useId()
  const copy = usePlayerCopy()
  if (tip === null || placeOfTip[tip] !== place) {
    return null
  }
  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-1 rounded-md border border-line bg-surface-raised px-5 pt-4 pb-1"
    >
      <h3 id={titleId} className="m-0 font-sans text-meta text-ink-muted">
        <LabelText label={copy.chrome((catalog) => catalog.townTipTitle())} />
      </h3>
      <p className="m-0 font-sans text-body text-ink">
        <LabelText label={copy.chrome(lineOfTip[tip])} />
      </p>
      <div>
        <Button type="button" tone="text" onClick={() => onClose(tip)}>
          <LabelText label={copy.chrome((catalog) => catalog.townTipClose())} />
        </Button>
      </div>
    </section>
  )
}
