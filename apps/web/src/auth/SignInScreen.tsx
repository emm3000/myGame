import type { SignInRequest } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { copy } from '../copy'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { TextField } from '../design-system/TextField'
import { TextLink } from '../design-system/TextLink'
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
      title={copy.auth.signIn.title}
      onSubmit={() => props.onSubmit({ email, password })}
      footer={
        <>
          {copy.auth.signIn.switchPrompt}
          <TextLink to="/sign-up">{copy.auth.signIn.switchLink}</TextLink>
        </>
      }
    >
      <TextField
        label={copy.auth.email}
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <TextField
        label={copy.auth.password}
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />
      {props.refusal === undefined ? null : <FormAlert message={copy.refusals[props.refusal]} />}
      <Button type="submit" tone="primary" disabled={props.isSubmitting}>
        {copy.auth.signIn.submit}
      </Button>
    </AuthPanel>
  )
}
