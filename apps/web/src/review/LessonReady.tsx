import { type ReactElement, useId } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Block } from '../design-system/Block'
import { ButtonLink } from '../design-system/ButtonLink'
import { blockHueOf } from '../design-system/blockHueOf'
import { LabelText } from '../design-system/LabelText'

export interface LessonReadyProps {
  readonly lessonId: string
  readonly lessonNumber: number | undefined
}

function LessonReadyBlock({ lessonNumber }: { readonly lessonNumber: number }): ReactElement {
  const titleId = useId()
  const { chrome } = usePlayerCopy()
  return (
    <Block hue={blockHueOf(lessonNumber - 1)} labelledBy={titleId}>
      <h2 id={titleId} className="m-0 text-display wrap-anywhere">
        <LabelText
          label={chrome((catalog) => catalog.reviewLessonReady({ number: lessonNumber }))}
        />
      </h2>
    </Block>
  )
}

export function LessonReady({ lessonId, lessonNumber }: LessonReadyProps): ReactElement {
  const { chrome } = usePlayerCopy()
  return (
    <div className="flex flex-col gap-3">
      {lessonNumber !== undefined && <LessonReadyBlock lessonNumber={lessonNumber} />}
      <ButtonLink to="/school/$lessonId" params={{ lessonId }} tone="primary">
        <LabelText label={chrome((catalog) => catalog.schoolLessonReadWords())} />
      </ButtonLink>
    </div>
  )
}
