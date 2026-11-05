import {
  lessonFree,
  lessonStart,
  lessonStudied,
  lessonTitle,
  lessonToReview,
  lessonUnderStudy,
} from '@mygame/catalog'
import type { ReactElement } from 'react'
import { ButtonLink } from '../design-system/ButtonLink'
import { CardAction, type CardActionState, cardToneOf } from '../design-system/CardAction'
import { CountdownLine } from '../design-system/CountdownLine'
import { Panel } from '../design-system/Panel'

export type LessonCardState =
  | { readonly kind: 'idle'; readonly action: CardActionState; readonly wordCount: number }
  | { readonly kind: 'underStudy'; readonly time: string }
  | { readonly kind: 'studied' }

export interface LessonCardProps {
  readonly fiefId: string
  readonly theme: string
  readonly state: LessonCardState
  readonly isWaiting: boolean
  readonly onStudy: () => void
}

function LessonBody({
  fiefId,
  state,
  isWaiting,
  onStudy,
}: Omit<LessonCardProps, 'theme'>): ReactElement {
  switch (state.kind) {
    case 'idle':
      return (
        <>
          <CardAction
            type="button"
            label={lessonStart()}
            state={state.action}
            isWaiting={isWaiting}
            onAction={onStudy}
          />
          <p className="m-0 font-sans text-caption text-ink-muted">
            {lessonFree({ wordCount: state.wordCount })}
          </p>
        </>
      )
    case 'underStudy':
      return <CountdownLine words={lessonUnderStudy()} time={state.time} />
    case 'studied':
      return (
        <>
          <p className="m-0 font-sans text-body text-ink">{lessonStudied()}</p>
          <ButtonLink to="/feudo/$fiefId/repaso" params={{ fiefId }} tone="quiet">
            {lessonToReview()}
          </ButtonLink>
        </>
      )
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}

const toneOf = (state: LessonCardState): string =>
  state.kind === 'idle' ? cardToneOf(state.action) : 'bg-surface-raised'

export function LessonCard({ theme, ...body }: LessonCardProps): ReactElement {
  return (
    <Panel element="article" toneClass={toneOf(body.state)} spacingClass="gap-3 p-5">
      <header className="flex flex-col gap-1">
        <h4 className="m-0 font-sans text-title text-ink">{lessonTitle()}</h4>
        <p lang="en" className="m-0 font-sans text-body text-ink-muted">
          {theme}
        </p>
      </header>
      <LessonBody {...body} />
    </Panel>
  )
}
