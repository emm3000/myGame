import type { ReactElement } from 'react'
import type { ButtonTone } from '../design-system/Button'
import { ButtonLink } from '../design-system/ButtonLink'
import type { NextStepAction } from './nextStepCardOf'

export interface NextStepLinkProps {
  readonly action: NextStepAction
  readonly tone: ButtonTone
}

export function NextStepLink({ action, tone }: NextStepLinkProps): ReactElement {
  if (action.to === '/school/$lessonId') {
    return (
      <ButtonLink to={action.to} params={{ lessonId: action.lessonId }} tone={tone}>
        {action.label}
      </ButtonLink>
    )
  }
  return (
    <ButtonLink to={action.to} tone={tone}>
      {action.label}
    </ButtonLink>
  )
}
