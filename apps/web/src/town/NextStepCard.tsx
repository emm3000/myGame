import { townNextTitle } from '@mygame/catalog'
import { type ReactElement, useId } from 'react'
import { ButtonLink } from '../design-system/ButtonLink'
import { CountdownLine } from '../design-system/CountdownLine'
import { Panel } from '../design-system/Panel'
import type { LiveTown } from './liveTown'
import { type NextStepAction, nextStepCardOf } from './nextStepCardOf'

function NextStepLink({ action }: { readonly action: NextStepAction }): ReactElement {
  if (action.to === '/school/$lessonId') {
    return (
      <ButtonLink to={action.to} params={{ lessonId: action.lessonId }} tone="primary">
        {action.label}
      </ButtonLink>
    )
  }
  return (
    <ButtonLink to={action.to} tone="primary">
      {action.label}
    </ButtonLink>
  )
}

export function NextStepCard({ town }: { readonly town: LiveTown }): ReactElement {
  const titleId = useId()
  const { line, detail, countdown, action } = nextStepCardOf(town)
  return (
    <Panel
      element="section"
      labelledBy={titleId}
      toneClass="bg-action-soft"
      spacingClass="gap-3 p-5"
    >
      <h3 id={titleId} className="m-0 font-sans text-label text-ink">
        {townNextTitle()}
      </h3>
      <p className="m-0 font-sans text-heading text-ink">{line}</p>
      {detail !== undefined && <p className="m-0 font-sans text-body text-ink">{detail}</p>}
      {countdown !== undefined && <CountdownLine {...countdown} />}
      <div className="flex">
        <NextStepLink action={action} />
      </div>
    </Panel>
  )
}
