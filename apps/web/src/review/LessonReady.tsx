import { reviewLessonReady, schoolLessonReadWords } from '@mygame/catalog'
import { type ReactElement, useId } from 'react'
import { Block } from '../design-system/Block'
import { ButtonLink } from '../design-system/ButtonLink'
import { blockHueOf } from '../design-system/blockHueOf'

export interface LessonReadyProps {
  readonly lessonId: string
  readonly lessonNumber: number | undefined
}

function LessonReadyBlock({ lessonNumber }: { readonly lessonNumber: number }): ReactElement {
  const titleId = useId()
  return (
    <Block hue={blockHueOf(lessonNumber - 1)} labelledBy={titleId}>
      <h2 id={titleId} className="m-0 text-display wrap-anywhere">
        {reviewLessonReady({ number: lessonNumber })}
      </h2>
    </Block>
  )
}

export function LessonReady({ lessonId, lessonNumber }: LessonReadyProps): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      {lessonNumber !== undefined && <LessonReadyBlock lessonNumber={lessonNumber} />}
      <ButtonLink to="/school/$lessonId" params={{ lessonId }} tone="primary">
        {schoolLessonReadWords()}
      </ButtonLink>
    </div>
  )
}
