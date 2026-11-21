import type { WordStanding } from '@mygame/domain'
import { type ReactElement, useId } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { ButtonLink } from '../design-system/ButtonLink'
import type { Label } from '../design-system/Label'
import { LabelText } from '../design-system/LabelText'
import { SchoolPath } from '../school/SchoolPath'
import { ReviewsAhead } from './ReviewsAhead'

export interface ReviewEndPath {
  readonly lessonNumber: number
  readonly standings: ReadonlyArray<WordStanding>
}

export interface ReviewEndProps {
  readonly line: Label
  readonly nextReview: Label | undefined
  readonly path: ReviewEndPath | undefined
}

function LessonPath({ path }: { readonly path: ReviewEndPath }): ReactElement {
  const titleId = useId()
  const { chrome } = usePlayerCopy()
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h2 id={titleId} className="m-0 font-sans text-heading text-ink">
        <LabelText
          label={chrome((catalog) => catalog.schoolLessonTitle({ number: path.lessonNumber }))}
        />
      </h2>
      <SchoolPath standings={path.standings} />
    </section>
  )
}

export function ReviewEnd({ line, nextReview, path }: ReviewEndProps): ReactElement {
  const { chrome } = usePlayerCopy()
  return (
    <div className="flex flex-col gap-4">
      <ReviewsAhead line={line} nextReview={nextReview} />
      {path !== undefined && <LessonPath path={path} />}
      <ButtonLink to="/" tone="primary">
        <LabelText label={chrome((catalog) => catalog.reviewBackToTown())} />
      </ButtonLink>
    </div>
  )
}
