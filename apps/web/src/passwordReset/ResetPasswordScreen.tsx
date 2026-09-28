import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { AuthPanel } from '../auth/AuthPanel'
import { copy } from '../copy'
import { Button } from '../design-system/Button'
import { ButtonLink } from '../design-system/ButtonLink'
import { FormAlert } from '../design-system/FormAlert'
import { TextField } from '../design-system/TextField'

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
    <AuthPanel
      title={copy.passwordReset.newPassword.title}
      onSubmit={() => props.onSubmit(password)}
    >
      <TextField
        label={copy.passwordReset.newPassword.password}
        name="new-password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        hint={copy.passwordReset.newPassword.passwordHint}
      />
      {props.refusal === undefined ? null : <FormAlert message={copy.refusals[props.refusal]} />}
      <Button type="submit" tone="primary" disabled={props.isSending}>
        {copy.passwordReset.newPassword.submit}
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
        <AuthPanel title={copy.passwordReset.newPassword.title}>
          <p role="status" className="m-0 font-body text-body text-ink">
            {copy.passwordReset.newPassword.changed}
          </p>
          <span className="flex">
            <ButtonLink to="/sign-in" tone="primary">
              {copy.passwordReset.newPassword.toSignIn}
            </ButtonLink>
          </span>
        </AuthPanel>
      )
    case 'linkRefused':
      return (
        <AuthPanel title={copy.passwordReset.newPassword.title}>
          <FormAlert message={copy.refusals.TokenInvalid} />
          <span className="flex">
            <ButtonLink to="/forgot-password" tone="quiet">
              {copy.passwordReset.newPassword.newLink}
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
