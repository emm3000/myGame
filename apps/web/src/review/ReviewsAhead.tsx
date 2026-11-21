import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { CountdownLine } from '../design-system/CountdownLine'
import type { Label } from '../design-system/Label'
import { LabelText } from '../design-system/LabelText'

export interface ReviewsAheadProps {
  readonly line: Label
  readonly nextReview: Label | undefined
}

export function ReviewsAhead({ line, nextReview }: ReviewsAheadProps): ReactElement {
  const { chrome } = usePlayerCopy()
  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-5">
      <p className="m-0 font-sans text-body text-ink">
        <LabelText label={line} />
      </p>
      {nextReview !== undefined && (
        <CountdownLine words={chrome((catalog) => catalog.reviewNextReview())} time={nextReview} />
      )}
    </div>
  )
}
