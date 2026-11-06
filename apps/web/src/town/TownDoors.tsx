import { reportReviewsDue, shellNavigationReport } from '@mygame/catalog'
import type { ReactElement } from 'react'
import { ButtonLink } from '../design-system/ButtonLink'
import { formatQuantity } from '../design-system/formatQuantity'
import { placeNameOf } from './placeNameOf'

function DueCount({ count }: { readonly count: number }): ReactElement {
  const figure = formatQuantity(count)
  return (
    <>
      {' '}
      <span className="sr-only">{reportReviewsDue({ count: figure })}</span>
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
  return (
    <div className="grid max-w-form grid-cols-2 gap-3">
      <ButtonLink to="/school" tone="quiet">
        {placeNameOf('school')}
      </ButtonLink>
      <ButtonLink to="/report" tone="quiet">
        {shellNavigationReport()}
        {dueCount > 0 && <DueCount count={dueCount} />}
      </ButtonLink>
    </div>
  )
}
