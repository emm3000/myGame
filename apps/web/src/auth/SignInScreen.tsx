import {
  authEmail,
  authPassword,
  authSignInForgotPassword,
  authSignInSubmit,
  authSignInSwitchLink,
  authSignInSwitchPrompt,
  authSignInTitle,
  authTagline,
} from '@mygame/catalog'
import type { SignInRequest } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { TextField } from '../design-system/TextField'
import { TextLink } from '../design-system/TextLink'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { AuthPanel } from './AuthPanel'

export interface SignInScreenProps {
  readonly refusal: ApiRefusal | undefined
  readonly isSubmitting: boolean
  readonly onSubmit: (request: SignInRequest) => void
}

export function SignInScreen(props: SignInScreenProps): ReactElement {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <AuthPanel
      title={authSignInTitle()}
      lead={authTagline()}
      onSubmit={() => props.onSubmit({ email, password })}
      footer={
        <>
          {authSignInSwitchPrompt()}
          <TextLink to="/sign-up">{authSignInSwitchLink()}</TextLink>
        </>
      }
    >
      <TextField
        label={authEmail()}
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <TextField
        label={authPassword()}
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />
      {props.refusal === undefined ? null : <FormAlert message={refusalLineOf(props.refusal)} />}
      <Button type="submit" tone="primary" disabled={props.isSubmitting}>
        {authSignInSubmit()}
      </Button>
      <span className="flex">
        <TextLink to="/forgot-password">{authSignInForgotPassword()}</TextLink>
      </span>
    </AuthPanel>
  )
}
