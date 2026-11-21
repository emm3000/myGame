import { type ReactElement, type Ref, useId } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Block } from '../design-system/Block'
import { ButtonLink } from '../design-system/ButtonLink'
import { CardAction } from '../design-system/CardAction'
import { FormAlert } from '../design-system/FormAlert'
import { blockFocusTargetClass } from '../design-system/focusTargetClass'
import { LabelText } from '../design-system/LabelText'
import type { LiveTown } from '../town/liveTown'
import { type LessonCardContent, readWordsLabelOf } from './lessonCardOf'
import { lessonRefusalLineOf } from './lessonRefusalLineOf'
import type { SchoolLessons } from './useSchoolLessons'

export interface ShownLessonProps {
  readonly card: LessonCardContent
  readonly town: LiveTown
  readonly lessons: SchoolLessons
  readonly titleRef: Ref<HTMLHeadingElement>
}

export function ShownLesson({ card, town, lessons, titleRef }: ShownLessonProps): ReactElement {
  const titleId = useId()
  const copy = usePlayerCopy()
  const { chrome, fixedCopy } = copy
  const { lessonSlot } = town
  const refused = lessons.startRefused?.subject === card.lessonId ? lessons.startRefused : undefined
  return (
    <div className="flex flex-col gap-5">
      <Block hue={card.hue} labelledBy={titleId}>
        <h2
          id={titleId}
          ref={titleRef}
          tabIndex={-1}
          className={`m-0 rounded-sm text-display ${blockFocusTargetClass}`}
        >
          <LabelText label={card.title} />
        </h2>
        <p lang="en" className="m-0 text-reading wrap-anywhere">
          {card.theme}
        </p>
        <p className="m-0 text-caption text-on-block-muted">
          <LabelText label={card.detailLine} />
        </p>
        {card.state.kind === 'studying' && (
          <p className="m-0 text-label">
            <LabelText label={chrome((catalog) => catalog.schoolLessonStudying())} />
          </p>
        )}
      </Block>
      {card.state.kind === 'open' && (
        <CardAction
          type="button"
          label={card.studyLabel}
          state={card.state.action}
          isWaiting={lessons.isStarting}
          tone={lessonSlot === null ? 'primary' : 'quiet'}
          onAction={() => lessons.start(card.lessonId)}
        />
      )}
      {lessonSlot !== null && (
        <ButtonLink
          to="/school/$lessonId"
          params={{ lessonId: lessonSlot.lessonId }}
          tone="primary"
        >
          <LabelText
            label={readWordsLabelOf(lessonSlot.lessonId, card.lessonId, town.overview, copy)}
          />
        </ButtonLink>
      )}
      {refused !== undefined && (
        <FormAlert message={lessonRefusalLineOf(refused, town, fixedCopy)} />
      )}
    </div>
  )
}
