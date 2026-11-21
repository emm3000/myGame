import { reviewNextReview } from '@mygame/catalog'
import type { ReactElement } from 'react'
import { CountdownLine } from '../design-system/CountdownLine'
import type { Label } from '../design-system/Label'
import { LabelText } from '../design-system/LabelText'
import { lineLabelOf } from '../design-system/lineLabelOf'

export interface ReviewsAheadProps {
  readonly line: Label
  readonly nextReview: string | undefined
}

export function ReviewsAhead({ line, nextReview }: ReviewsAheadProps): ReactElement {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-5">
      <p className="m-0 font-sans text-body text-ink">
        <LabelText label={line} />
      </p>
      {nextReview !== undefined && (
        <CountdownLine words={lineLabelOf(reviewNextReview(), 'es')} time={nextReview} />
      )}
    </div>
  )
}
