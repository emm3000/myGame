import {
  authEmail,
  authSignInTitle,
  passwordResetRequestConfirmation,
  passwordResetRequestSubmit,
  passwordResetRequestTitle,
  refusalMalformedEmail,
} from '@mygame/catalog'
import { ForgotPasswordRequestSchema } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { AuthPanel } from '../auth/AuthPanel'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { TextField } from '../design-system/TextField'
import { TextLink } from '../design-system/TextLink'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { ConfirmationLine } from './ConfirmationLine'

export type ForgotPasswordState =
  | { readonly kind: 'editing'; readonly refusal: ApiRefusal | undefined }
  | { readonly kind: 'sending' }
  | { readonly kind: 'sent' }

export interface ForgotPasswordScreenProps {
  readonly state: ForgotPasswordState
  readonly onSubmit: (email: string) => void
}

interface RequestFormProps {
  readonly refusal: ApiRefusal | undefined
  readonly isSending: boolean
  readonly onSubmit: (email: string) => void
}

function RequestForm(props: RequestFormProps): ReactElement {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>(undefined)

  const submit = (): void => {
    const isValid = ForgotPasswordRequestSchema.safeParse({ email }).success
    setEmailError(isValid ? undefined : refusalMalformedEmail())
    if (isValid) {
      props.onSubmit(email)
    }
  }

  return (
    <AuthPanel
      title={passwordResetRequestTitle()}
      onSubmit={submit}
      footer={<TextLink to="/sign-in">{authSignInTitle()}</TextLink>}
    >
      <TextField
        label={authEmail()}
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        error={emailError}
      />
      {props.refusal === undefined ? null : <FormAlert message={refusalLineOf(props.refusal)} />}
      <Button type="submit" tone="primary" disabled={props.isSending}>
        {passwordResetRequestSubmit()}
      </Button>
    </AuthPanel>
  )
}

export function ForgotPasswordScreen({ state, onSubmit }: ForgotPasswordScreenProps): ReactElement {
  if (state.kind === 'sent') {
    return (
      <AuthPanel
        title={passwordResetRequestTitle()}
        footer={<TextLink to="/sign-in">{authSignInTitle()}</TextLink>}
      >
        <ConfirmationLine line={passwordResetRequestConfirmation()} />
      </AuthPanel>
    )
  }
  return (
    <RequestForm
      refusal={state.kind === 'editing' ? state.refusal : undefined}
      isSending={state.kind === 'sending'}
      onSubmit={onSubmit}
    />
  )
}
