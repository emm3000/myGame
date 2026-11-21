import { type ReactElement, useId } from 'react'
import type { ChromeCatalog } from '../copy/PlayerCopy'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { CardAction } from '../design-system/CardAction'
import { FormAlert } from '../design-system/FormAlert'
import { focusTargetClass } from '../design-system/focusTargetClass'
import type { Label } from '../design-system/Label'
import { LabelText } from '../design-system/LabelText'
import { spokenLineOf } from '../design-system/spokenLineOf'
import type { LiveTown } from '../town/liveTown'
import type { LessonCardContent, LessonCardState } from './lessonCardOf'
import { lessonRefusalLineOf } from './lessonRefusalLineOf'
import type { ReleasedRowContent } from './releasedRowOf'
import { SchoolPath } from './SchoolPath'
import type { SchoolLessons } from './useSchoolLessons'

const statusOf = (state: LessonCardState): ((catalog: ChromeCatalog) => string) | undefined => {
  switch (state.kind) {
    case 'studied':
      return (catalog) => catalog.schoolLessonStudied()
    case 'studying':
      return (catalog) => catalog.schoolLessonStudying()
    case 'open':
      return undefined
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

function RowTitle({
  title,
  state,
}: {
  readonly title: Label
  readonly state: LessonCardState
}): ReactElement {
  const { chrome } = usePlayerCopy()
  const status = statusOf(state)
  return (
    <span className="flex flex-wrap items-baseline gap-x-3">
      <span className="font-sans text-title text-ink">
        <LabelText label={title} />
      </span>
      {status !== undefined && (
        <span className="font-sans text-caption text-ink-muted">
          <LabelText label={chrome(status)} />
        </span>
      )}
    </span>
  )
}

function RowContent({ card }: { readonly card: LessonCardContent }): ReactElement {
  return (
    <>
      <RowTitle title={card.title} state={card.state} />
      <span lang="en" className="font-sans text-body text-ink wrap-anywhere">
        {card.theme}
      </span>
      <span className="font-sans text-caption text-ink-muted">
        <LabelText label={card.detailLine} />
      </span>
    </>
  )
}

const rowClass = 'flex w-full flex-col items-start gap-1 pt-3 text-left'

const rowItemClass = 'flex flex-col gap-2 border-line border-t pb-3 first:border-t-0'

function LessonRow({
  card,
  onSelect,
}: {
  readonly card: LessonCardContent
  readonly onSelect: (lessonId: string) => void
}): ReactElement {
  return (
    <li aria-label={spokenLineOf(card.title)} className={rowItemClass}>
      {card.state.kind !== 'studied' ? (
        <button
          type="button"
          onClick={() => onSelect(card.lessonId)}
          className={`${rowClass} min-h-secondary cursor-pointer rounded-sm border-0 bg-transparent px-0 ${focusTargetClass}`}
        >
          <RowContent card={card} />
        </button>
      ) : (
        <div className={rowClass}>
          <RowContent card={card} />
        </div>
      )}
      <SchoolPath standings={card.standings} />
    </li>
  )
}

function ReleasedLessonRow({
  card,
  town,
  lessons,
}: {
  readonly card: ReleasedRowContent
  readonly town: LiveTown
  readonly lessons: SchoolLessons
}): ReactElement {
  const { fixedCopy } = usePlayerCopy()
  const refused = lessons.startRefused?.subject === card.lessonId ? lessons.startRefused : undefined
  return (
    <li aria-label={spokenLineOf(card.title)} className={rowItemClass}>
      <div className={rowClass}>
        <RowTitle title={card.title} state={card.state} />
        <span className="font-sans text-caption text-ink-muted">
          <LabelText label={card.wordsLine} />
        </span>
      </div>
      <SchoolPath standings={card.standings} />
      {card.state.kind === 'open' && (
        <CardAction
          type="button"
          label={card.studyLabel}
          state={card.state.action}
          isWaiting={lessons.isStarting}
          tone="quiet"
          onAction={() => lessons.start(card.lessonId)}
        />
      )}
      {refused !== undefined && (
        <FormAlert message={lessonRefusalLineOf(refused, town, fixedCopy)} />
      )}
    </li>
  )
}

export interface LessonRowsProps {
  readonly cards: ReadonlyArray<LessonCardContent>
  readonly releasedCards: ReadonlyArray<ReleasedRowContent>
  readonly town: LiveTown
  readonly lessons: SchoolLessons
  readonly onSelect: (lessonId: string) => void
}

export function LessonRows({
  cards,
  releasedCards,
  town,
  lessons,
  onSelect,
}: LessonRowsProps): ReactElement | null {
  const titleId = useId()
  const { chrome } = usePlayerCopy()
  if (cards.length === 0 && releasedCards.length === 0) {
    return null
  }
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-1">
      <h2 id={titleId} className="m-0 font-sans text-heading text-ink">
        <LabelText label={chrome((catalog) => catalog.schoolLessons())} />
      </h2>
      <ul className="m-0 flex list-none flex-col p-0">
        {cards.map((card) => (
          <LessonRow key={card.lessonId} card={card} onSelect={onSelect} />
        ))}
        {releasedCards.map((card) => (
          <ReleasedLessonRow key={card.lessonId} card={card} town={town} lessons={lessons} />
        ))}
      </ul>
    </section>
  )
}
