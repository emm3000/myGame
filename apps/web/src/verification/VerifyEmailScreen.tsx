import {
  authSignInTitle,
  verificationVerifyTitle,
  verificationVerifyToFief,
  verificationVerifyVerified,
  verificationVerifyVerifying,
} from '@mygame/catalog'
import type { ReactElement } from 'react'
import { AuthPanel } from '../auth/AuthPanel'
import { ButtonLink } from '../design-system/ButtonLink'
import { FormAlert } from '../design-system/FormAlert'
import { TextLink } from '../design-system/TextLink'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { VerifyEmailState } from './useVerifyEmail'

export interface VerifyEmailScreenProps {
  readonly state: VerifyEmailState
}

export function VerifyEmailScreen({ state }: VerifyEmailScreenProps): ReactElement {
  switch (state.kind) {
    case 'verifying':
      return (
        <AuthPanel title={verificationVerifyTitle()}>
          <p role="status" className="m-0 font-sans text-body text-ink-muted">
            {verificationVerifyVerifying()}
          </p>
        </AuthPanel>
      )
    case 'verified':
      return (
        <AuthPanel title={verificationVerifyTitle()}>
          <p role="status" className="m-0 font-sans text-body text-ink">
            {verificationVerifyVerified()}
          </p>
          <ButtonLink to="/" tone="primary">
            {verificationVerifyToFief()}
          </ButtonLink>
        </AuthPanel>
      )
    case 'refused':
      return (
        <AuthPanel
          title={verificationVerifyTitle()}
          footer={<TextLink to="/sign-in">{authSignInTitle()}</TextLink>}
        >
          <FormAlert message={refusalLineOf(state.refusal)} />
        </AuthPanel>
      )
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}
