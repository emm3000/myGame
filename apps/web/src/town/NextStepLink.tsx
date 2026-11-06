import type { ReactElement } from 'react'
import type { ButtonTone } from '../design-system/Button'
import { ButtonLink } from '../design-system/ButtonLink'
import type { NextStepAction } from './nextStepCardOf'

export interface NextStepLinkProps {
  readonly action: NextStepAction
  readonly tone: ButtonTone
  readonly onFollow?: () => void
}

export function NextStepLink({ action, tone, onFollow }: NextStepLinkProps): ReactElement {
  if (action.to === '/school/$lessonId') {
    return (
      <ButtonLink
        to={action.to}
        params={{ lessonId: action.lessonId }}
        tone={tone}
        onClick={onFollow}
      >
        {action.label}
      </ButtonLink>
    )
  }
  return (
    <ButtonLink to={action.to} tone={tone} onClick={onFollow}>
      {action.label}
    </ButtonLink>
  )
}
