import { reviewNextReview } from '@mygame/catalog'
import type { ReactElement } from 'react'
import { CountdownLine } from '../design-system/CountdownLine'

export interface ReviewsAheadProps {
  readonly line: string
  readonly nextReview: string | undefined
}

export function ReviewsAhead({ line, nextReview }: ReviewsAheadProps): ReactElement {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-5">
      <p className="m-0 font-sans text-body text-ink">{line}</p>
      {nextReview !== undefined && <CountdownLine words={reviewNextReview()} time={nextReview} />}
    </div>
  )
}
