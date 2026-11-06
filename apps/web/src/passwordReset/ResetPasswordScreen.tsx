import {
  authSignInTitle,
  passwordResetNewPasswordChanged,
  passwordResetNewPasswordNewLink,
  passwordResetNewPasswordPassword,
  passwordResetNewPasswordPasswordHint,
  passwordResetNewPasswordSubmit,
  passwordResetNewPasswordTitle,
  refusalTokenInvalid,
} from '@mygame/catalog'
import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { AuthPanel } from '../auth/AuthPanel'
import { Button } from '../design-system/Button'
import { ButtonLink } from '../design-system/ButtonLink'
import { FormAlert } from '../design-system/FormAlert'
import { TextField } from '../design-system/TextField'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { ConfirmationLine } from './ConfirmationLine'

export type ResetPasswordState =
  | { readonly kind: 'editing'; readonly refusal: ApiRefusal | undefined }
  | { readonly kind: 'sending' }
  | { readonly kind: 'changed' }
  | { readonly kind: 'linkRefused' }

export interface ResetPasswordScreenProps {
  readonly state: ResetPasswordState
  readonly onSubmit: (password: string) => void
}

interface NewPasswordFormProps {
  readonly refusal: ApiRefusal | undefined
  readonly isSending: boolean
  readonly onSubmit: (password: string) => void
}

function NewPasswordForm(props: NewPasswordFormProps): ReactElement {
  const [password, setPassword] = useState('')
  return (
    <AuthPanel title={passwordResetNewPasswordTitle()} onSubmit={() => props.onSubmit(password)}>
      <TextField
        label={passwordResetNewPasswordPassword()}
        name="new-password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        hint={passwordResetNewPasswordPasswordHint()}
      />
      {props.refusal === undefined ? null : <FormAlert message={refusalLineOf(props.refusal)} />}
      <Button type="submit" tone="primary" disabled={props.isSending}>
        {passwordResetNewPasswordSubmit()}
      </Button>
    </AuthPanel>
  )
}

export function ResetPasswordScreen({ state, onSubmit }: ResetPasswordScreenProps): ReactElement {
  switch (state.kind) {
    case 'editing':
    case 'sending':
      return (
        <NewPasswordForm
          refusal={state.kind === 'editing' ? state.refusal : undefined}
          isSending={state.kind === 'sending'}
          onSubmit={onSubmit}
        />
      )
    case 'changed':
      return (
        <AuthPanel title={passwordResetNewPasswordTitle()}>
          <ConfirmationLine line={passwordResetNewPasswordChanged()} />
          <ButtonLink to="/sign-in" tone="primary">
            {authSignInTitle()}
          </ButtonLink>
        </AuthPanel>
      )
    case 'linkRefused':
      return (
        <AuthPanel title={passwordResetNewPasswordTitle()}>
          <FormAlert message={refusalTokenInvalid()} />
          <span className="flex">
            <ButtonLink to="/forgot-password" tone="quiet">
              {passwordResetNewPasswordNewLink()}
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
