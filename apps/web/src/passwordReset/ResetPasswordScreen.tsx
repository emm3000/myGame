import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { AuthPanel } from '../auth/AuthPanel'
import type { SignedOutCopy } from '../auth/SignedOutCopy'
import { Button } from '../design-system/Button'
import { ButtonLink } from '../design-system/ButtonLink'
import { FormAlert } from '../design-system/FormAlert'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { TextField } from '../design-system/TextField'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { ConfirmationLine } from './ConfirmationLine'

export type ResetPasswordState =
  | { readonly kind: 'editing'; readonly refusal: ApiRefusal | undefined }
  | { readonly kind: 'sending' }
  | { readonly kind: 'changed' }
  | { readonly kind: 'linkRefused' }

export interface ResetPasswordScreenProps {
  readonly copy: SignedOutCopy
  readonly state: ResetPasswordState
  readonly onSubmit: (password: string) => void
}

interface NewPasswordFormProps {
  readonly copy: SignedOutCopy
  readonly refusal: ApiRefusal | undefined
  readonly isSending: boolean
  readonly onSubmit: (password: string) => void
}

function NewPasswordForm(props: NewPasswordFormProps): ReactElement {
  const { catalog, language } = props.copy
  const [password, setPassword] = useState('')
  return (
    <AuthPanel
      copy={props.copy}
      title={catalog.passwordResetNewPasswordTitle()}
      onSubmit={() => props.onSubmit(password)}
    >
      <TextField
        label={lineLabelOf(catalog.passwordResetNewPasswordPassword(), language)}
        name="new-password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        hint={lineLabelOf(catalog.passwordResetNewPasswordPasswordHint(), language)}
      />
      {props.refusal === undefined ? null : (
        <FormAlert message={lineLabelOf(refusalLineOf(catalog, props.refusal), language)} />
      )}
      <Button type="submit" tone="primary" disabled={props.isSending}>
        {catalog.passwordResetNewPasswordSubmit()}
      </Button>
    </AuthPanel>
  )
}

export function ResetPasswordScreen({
  copy,
  state,
  onSubmit,
}: ResetPasswordScreenProps): ReactElement {
  const { catalog, language } = copy
  switch (state.kind) {
    case 'editing':
    case 'sending':
      return (
        <NewPasswordForm
          copy={copy}
          refusal={state.kind === 'editing' ? state.refusal : undefined}
          isSending={state.kind === 'sending'}
          onSubmit={onSubmit}
        />
      )
    case 'changed':
      return (
        <AuthPanel copy={copy} title={catalog.passwordResetNewPasswordTitle()}>
          <ConfirmationLine line={catalog.passwordResetNewPasswordChanged()} />
          <ButtonLink to="/sign-in" tone="primary">
            {catalog.authSignInTitle()}
          </ButtonLink>
        </AuthPanel>
      )
    case 'linkRefused':
      return (
        <AuthPanel copy={copy} title={catalog.passwordResetNewPasswordTitle()}>
          <FormAlert message={lineLabelOf(catalog.refusalTokenInvalid(), language)} />
          <span className="flex">
            <ButtonLink to="/forgot-password" tone="quiet">
              {catalog.passwordResetNewPasswordNewLink()}
            </ButtonLink>
          </span>
        </AuthPanel>
      )
    default: {
      const unreachable: never = state
      return unreachable
    }
  }
}
