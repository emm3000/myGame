import {
  authEmail,
  authPassword,
  authSignInForgotPassword,
  authSignInSubmit,
  authSignInSwitchLink,
  authSignInSwitchPrompt,
  authSignInTitle,
  authTagline,
  es,
} from '@mygame/catalog'
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
        label={lineLabelOf(authEmail(), 'es')}
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <TextField
        label={lineLabelOf(authPassword(), 'es')}
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />
      {props.refusal === undefined ? null : (
        <FormAlert message={lineLabelOf(refusalLineOf(es, props.refusal), 'es')} />
      )}
      <Button type="submit" tone="primary" disabled={props.isSubmitting}>
        {authSignInSubmit()}
      </Button>
      <span className="flex">
        <TextLink to="/forgot-password">{authSignInForgotPassword()}</TextLink>
      </span>
    </AuthPanel>
  )
}
