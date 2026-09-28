import { ForgotPasswordRequestSchema } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { AuthPanel } from '../auth/AuthPanel'
import { copy } from '../copy'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { TextField } from '../design-system/TextField'
import { TextLink } from '../design-system/TextLink'

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
    setEmailError(isValid ? undefined : copy.auth.invalidEmail)
    if (isValid) {
      props.onSubmit(email)
    }
  }

  return (
    <AuthPanel
      title={copy.passwordReset.request.title}
      onSubmit={submit}
      footer={<TextLink to="/sign-in">{copy.passwordReset.request.toSignIn}</TextLink>}
    >
      <TextField
        label={copy.auth.email}
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        error={emailError}
      />
      {props.refusal === undefined ? null : <FormAlert message={copy.refusals[props.refusal]} />}
      <Button type="submit" tone="primary" disabled={props.isSending}>
        {copy.passwordReset.request.submit}
      </Button>
    </AuthPanel>
  )
}

export function ForgotPasswordScreen({ state, onSubmit }: ForgotPasswordScreenProps): ReactElement {
  if (state.kind === 'sent') {
    return (
      <AuthPanel
        title={copy.passwordReset.request.title}
        footer={<TextLink to="/sign-in">{copy.passwordReset.request.toSignIn}</TextLink>}
      >
        <p role="status" className="m-0 font-body text-body text-ink">
          {copy.passwordReset.request.confirmation}
        </p>
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
