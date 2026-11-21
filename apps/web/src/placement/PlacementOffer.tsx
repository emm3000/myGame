import { type ReactElement, useId } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { LabelText } from '../design-system/LabelText'
import { TextLink } from '../design-system/TextLink'
import type { PlacementOfferState } from './usePlacementOffer'

export function PlacementOffer({
  offer,
}: {
  readonly offer: PlacementOfferState
}): ReactElement | null {
  const titleId = useId()
  const { fixedCopy } = usePlayerCopy()
  if (offer === 'hidden') {
    return null
  }
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-1 font-sans">
      <h2 id={titleId} className="m-0 text-heading text-ink">
        <LabelText label={fixedCopy((catalog) => catalog.placementTitle())} />
      </h2>
      <p className="m-0 text-caption text-ink-muted">
        <LabelText label={fixedCopy((catalog) => catalog.placementOfferLine())} />
      </p>
      <p className="m-0">
        <TextLink to="/placement">
          <LabelText
            label={fixedCopy((catalog) =>
              offer === 'offered'
                ? catalog.placementOfferLink()
                : catalog.placementOfferResumeLink(),
            )}
          />
        </TextLink>
      </p>
    </section>
  )
}
