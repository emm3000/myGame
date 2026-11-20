import {
  placementOfferLine,
  placementOfferLink,
  placementOfferResumeLink,
  placementTitle,
} from '@mygame/catalog'
import { type ReactElement, useId } from 'react'
import { TextLink } from '../design-system/TextLink'
import type { PlacementOfferState } from './usePlacementOffer'

export function PlacementOffer({
  offer,
}: {
  readonly offer: PlacementOfferState
}): ReactElement | null {
  const titleId = useId()
  if (offer === 'hidden') {
    return null
  }
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-1 font-sans">
      <h2 id={titleId} className="m-0 text-heading text-ink">
        {placementTitle()}
      </h2>
      <p className="m-0 text-caption text-ink-muted">{placementOfferLine()}</p>
      <p className="m-0">
        <TextLink to="/placement">
          {offer === 'offered' ? placementOfferLink() : placementOfferResumeLink()}
        </TextLink>
      </p>
    </section>
  )
}
