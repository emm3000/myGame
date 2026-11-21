import { ForgotPasswordRequestSchema } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { AuthPanel } from '../auth/AuthPanel'
import type { SignedOutCopy } from '../auth/SignedOutCopy'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { TextField } from '../design-system/TextField'
import { TextLink } from '../design-system/TextLink'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { ConfirmationLine } from './ConfirmationLine'

export type ForgotPasswordState =
  | { readonly kind: 'editing'; readonly refusal: ApiRefusal | undefined }
  | { readonly kind: 'sending' }
  | { readonly kind: 'sent' }

export interface ForgotPasswordScreenProps {
  readonly copy: SignedOutCopy
  readonly state: ForgotPasswordState
  readonly onSubmit: (email: string) => void
}

interface RequestFormProps {
  readonly copy: SignedOutCopy
  readonly refusal: ApiRefusal | undefined
  readonly isSending: boolean
  readonly onSubmit: (email: string) => void
}

function RequestForm(props: RequestFormProps): ReactElement {
  const { catalog, language } = props.copy
  const [email, setEmail] = useState('')
  const [isMalformed, setIsMalformed] = useState(false)

  const submit = (): void => {
    const isValid = ForgotPasswordRequestSchema.safeParse({ email }).success
    setIsMalformed(!isValid)
    if (isValid) {
      props.onSubmit(email)
    }
  }

  return (
    <AuthPanel
      copy={props.copy}
      title={catalog.passwordResetRequestTitle()}
      onSubmit={submit}
      footer={<TextLink to="/sign-in">{catalog.authSignInTitle()}</TextLink>}
    >
      <TextField
        label={lineLabelOf(catalog.authEmail(), language)}
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        error={isMalformed ? catalog.refusalMalformedEmail() : undefined}
      />
      {props.refusal === undefined ? null : (
        <FormAlert message={lineLabelOf(refusalLineOf(catalog, props.refusal), language)} />
      )}
      <Button type="submit" tone="primary" disabled={props.isSending}>
        {catalog.passwordResetRequestSubmit()}
      </Button>
    </AuthPanel>
  )
}

export function ForgotPasswordScreen({
  copy,
  state,
  onSubmit,
}: ForgotPasswordScreenProps): ReactElement {
  if (state.kind === 'sent') {
    return (
      <AuthPanel
        copy={copy}
        title={copy.catalog.passwordResetRequestTitle()}
        footer={<TextLink to="/sign-in">{copy.catalog.authSignInTitle()}</TextLink>}
      >
        <ConfirmationLine line={copy.catalog.passwordResetRequestConfirmation()} />
      </AuthPanel>
    )
  }
  return (
    <RequestForm
      copy={copy}
      refusal={state.kind === 'editing' ? state.refusal : undefined}
      isSending={state.kind === 'sending'}
      onSubmit={onSubmit}
    />
  )
}
