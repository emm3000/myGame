import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { ButtonLink } from '../design-system/ButtonLink'
import { formatQuantity } from '../design-system/formatQuantity'
import { LabelText } from '../design-system/LabelText'
import { placeNameOf } from './placeNameOf'

function DueCount({ count }: { readonly count: number }): ReactElement {
  const figure = formatQuantity(count)
  const copy = usePlayerCopy()
  return (
    <>
      {' '}
      <span className="sr-only">
        <LabelText label={copy.chrome((catalog) => catalog.reportReviewsDue({ count: figure }))} />
      </span>
      <span
        aria-hidden="true"
        className="ml-2 rounded-pill bg-action px-2 font-sans text-label text-on-action tabular-nums"
      >
        {figure}
      </span>
    </>
  )
}

export function TownDoors({ dueCount }: { readonly dueCount: number }): ReactElement {
  const copy = usePlayerCopy()
  return (
    <div className="grid max-w-form grid-cols-2 gap-3">
      <ButtonLink to="/school" tone="quiet">
        <LabelText label={copy.chrome((catalog) => placeNameOf(catalog, 'school'))} />
      </ButtonLink>
      <ButtonLink to="/report" tone="quiet">
        <LabelText label={copy.chrome((catalog) => catalog.shellNavigationReport())} />
        {dueCount > 0 && <DueCount count={dueCount} />}
      </ButtonLink>
    </div>
  )
}
