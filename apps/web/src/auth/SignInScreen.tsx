import type { SignInRequest } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { TextField } from '../design-system/TextField'
import { TextLink } from '../design-system/TextLink'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { AuthPanel } from './AuthPanel'
import type { SignedOutCopy } from './SignedOutCopy'

export interface SignInScreenProps {
  readonly copy: SignedOutCopy
  readonly refusal: ApiRefusal | undefined
  readonly isSubmitting: boolean
  readonly onSubmit: (request: SignInRequest) => void
}

export function SignInScreen(props: SignInScreenProps): ReactElement {
  const { catalog, language } = props.copy
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <AuthPanel
      copy={props.copy}
      title={catalog.authSignInTitle()}
      lead={catalog.authTagline()}
      onSubmit={() => props.onSubmit({ email, password })}
      footer={
        <>
          {catalog.authSignInSwitchPrompt()}
          <TextLink to="/sign-up">{catalog.authSignInSwitchLink()}</TextLink>
        </>
      }
    >
      <TextField
        label={lineLabelOf(catalog.authEmail(), language)}
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <TextField
        label={lineLabelOf(catalog.authPassword(), language)}
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />
      {props.refusal === undefined ? null : (
        <FormAlert message={lineLabelOf(refusalLineOf(catalog, props.refusal), language)} />
      )}
      <Button type="submit" tone="primary" disabled={props.isSubmitting}>
        {catalog.authSignInSubmit()}
      </Button>
      <span className="flex">
        <TextLink to="/forgot-password">{catalog.authSignInForgotPassword()}</TextLink>
      </span>
    </AuthPanel>
  )
}
