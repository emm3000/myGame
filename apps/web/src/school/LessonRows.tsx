import { schoolLessonStudied, schoolLessonStudying, schoolLessons } from '@mygame/catalog'
import { type ReactElement, useId } from 'react'
import { focusTargetClass } from '../design-system/focusTargetClass'
import type { LessonCardContent } from './lessonCardOf'
import { SchoolPath } from './SchoolPath'

const statusOf = ({ state }: LessonCardContent): string | undefined => {
  switch (state.kind) {
    case 'studied':
      return schoolLessonStudied()
    case 'studying':
      return schoolLessonStudying()
    case 'open':
      return undefined
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

function RowContent({ card }: { readonly card: LessonCardContent }): ReactElement {
  const status = statusOf(card)
  return (
    <>
      <span className="flex flex-wrap items-baseline gap-x-3">
        <span className="font-sans text-title text-ink">{card.title}</span>
        {status !== undefined && (
          <span className="font-sans text-caption text-ink-muted">{status}</span>
        )}
      </span>
      <span lang="en" className="font-sans text-body text-ink wrap-anywhere">
        {card.theme}
      </span>
      <span className="font-sans text-caption text-ink-muted">
        {card.wordsLine} · {card.skillLine}
      </span>
    </>
  )
}

const rowClass = 'flex w-full flex-col items-start gap-1 pt-3 text-left'

function LessonRow({
  card,
  onSelect,
}: {
  readonly card: LessonCardContent
  readonly onSelect: (lessonId: string) => void
}): ReactElement {
  return (
    <li
      aria-label={card.title}
      className="flex flex-col gap-2 border-line border-t pb-3 first:border-t-0"
    >
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

export interface LessonRowsProps {
  readonly cards: ReadonlyArray<LessonCardContent>
  readonly onSelect: (lessonId: string) => void
}

export function LessonRows({ cards, onSelect }: LessonRowsProps): ReactElement | null {
  const titleId = useId()
  if (cards.length === 0) {
    return null
  }
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-1">
      <h2 id={titleId} className="m-0 font-sans text-heading text-ink">
        {schoolLessons()}
      </h2>
      <ul className="m-0 flex list-none flex-col p-0">
        {cards.map((card) => (
          <LessonRow key={card.lessonId} card={card} onSelect={onSelect} />
        ))}
      </ul>
    </section>
  )
}
