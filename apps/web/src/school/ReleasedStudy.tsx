import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import type { ActionTone } from '../design-system/Button'
import { CardAction } from '../design-system/CardAction'
import { FormAlert } from '../design-system/FormAlert'
import type { LiveTown } from '../town/liveTown'
import { lessonRefusalLineOf } from './lessonRefusalLineOf'
import type { ReleasedRowContent } from './releasedRowOf'
import type { SchoolLessons } from './useSchoolLessons'

export interface ReleasedStudyProps {
  readonly card: ReleasedRowContent
  readonly town: LiveTown
  readonly lessons: SchoolLessons
  readonly tone: ActionTone
}

export function ReleasedStudy({ card, town, lessons, tone }: ReleasedStudyProps): ReactElement {
  const { fixedCopy } = usePlayerCopy()
  const refused = lessons.startRefused?.subject === card.lessonId ? lessons.startRefused : undefined
  return (
    <>
      {card.state.kind === 'open' && (
        <CardAction
          type="button"
          label={card.studyLabel}
          state={card.state.action}
          isWaiting={lessons.isStarting}
          tone={tone}
          onAction={() => lessons.start(card.lessonId)}
        />
      )}
      {refused !== undefined && (
        <FormAlert message={lessonRefusalLineOf(refused, town, fixedCopy)} />
      )}
    </>
  )
}
