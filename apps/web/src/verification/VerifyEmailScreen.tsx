import type { ReactElement } from 'react'
import { AuthPanel } from '../auth/AuthPanel'
import { copy } from '../copy'
import { ButtonLink } from '../design-system/ButtonLink'
import { FormAlert } from '../design-system/FormAlert'
import { TextLink } from '../design-system/TextLink'
import type { VerifyEmailState } from './useVerifyEmail'

export interface VerifyEmailScreenProps {
  readonly state: VerifyEmailState
}

export function VerifyEmailScreen({ state }: VerifyEmailScreenProps): ReactElement {
  switch (state.kind) {
    case 'verifying':
      return (
        <AuthPanel title={copy.verification.verify.title}>
          <p role="status" className="m-0 font-body text-body text-ink-muted">
            {copy.verification.verify.verifying}
          </p>
        </AuthPanel>
      )
    case 'verified':
      return (
        <AuthPanel title={copy.verification.verify.title}>
          <p role="status" className="m-0 font-body text-body text-ink">
            {copy.verification.verify.verified}
          </p>
          <span className="flex">
            <ButtonLink to="/" tone="primary">
              {copy.verification.verify.toFief}
            </ButtonLink>
          </span>
        </AuthPanel>
      )
    case 'refused':
      return (
        <AuthPanel
          title={copy.verification.verify.title}
          footer={<TextLink to="/sign-in">{copy.verification.verify.toSignIn}</TextLink>}
        >
          <FormAlert message={copy.refusals[state.refusal]} />
        </AuthPanel>
      )
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}
