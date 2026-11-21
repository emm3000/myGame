import type { ReactElement } from 'react'
import { AuthPanel } from '../auth/AuthPanel'
import type { SignedOutCopy } from '../auth/SignedOutCopy'
import { ButtonLink } from '../design-system/ButtonLink'
import { FormAlert } from '../design-system/FormAlert'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { TextLink } from '../design-system/TextLink'
import { refusalLineOf } from '../refusals/refusalLineOf'
import type { VerifyEmailState } from './useVerifyEmail'

export interface VerifyEmailScreenProps {
  readonly copy: SignedOutCopy
  readonly state: VerifyEmailState
}

export function VerifyEmailScreen({ copy, state }: VerifyEmailScreenProps): ReactElement {
  const { catalog, language } = copy
  switch (state.kind) {
    case 'verifying':
      return (
        <AuthPanel copy={copy} title={catalog.verificationVerifyTitle()}>
          <p role="status" className="m-0 font-sans text-body text-ink-muted">
            {catalog.verificationVerifyVerifying()}
          </p>
        </AuthPanel>
      )
    case 'verified':
      return (
        <AuthPanel copy={copy} title={catalog.verificationVerifyTitle()}>
          <p role="status" className="m-0 font-sans text-body text-ink">
            {catalog.verificationVerifyVerified()}
          </p>
          <ButtonLink to="/" tone="primary">
            {catalog.verificationVerifyToTown()}
          </ButtonLink>
        </AuthPanel>
      )
    case 'refused':
      return (
        <AuthPanel
          copy={copy}
          title={catalog.verificationVerifyTitle()}
          footer={<TextLink to="/sign-in">{catalog.authSignInTitle()}</TextLink>}
        >
          <FormAlert message={lineLabelOf(refusalLineOf(catalog, state.refusal), language)} />
        </AuthPanel>
      )
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}
