import {
  authEmail,
  authPassword,
  authSignUpFiefName,
  authSignUpPasswordHint,
  authSignUpSubmit,
  authSignUpSwitchLink,
  authSignUpSwitchPrompt,
  authSignUpTitle,
  refusalBlankFiefName,
  refusalMalformedEmail,
  refusalWeakPassword,
} from '@mygame/catalog'
import { type SignUpRequest, SignUpRequestSchema } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { TextField } from '../design-system/TextField'
import { TextLink } from '../design-system/TextLink'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { AuthPanel } from './AuthPanel'

type SignUpField = keyof SignUpRequest

type FieldErrors = Partial<Record<SignUpField, string>>

export interface SignUpScreenProps {
  readonly refusal: ApiRefusal | undefined
  readonly isSubmitting: boolean
  readonly onSubmit: (request: SignUpRequest) => void
}

const fieldMessages: Readonly<Record<SignUpField, string>> = {
  email: refusalMalformedEmail(),
  password: refusalWeakPassword(),
  fiefName: refusalBlankFiefName(),
}

const refusalFields: Partial<Record<ApiRefusal, SignUpField>> = {
  EmailTaken: 'email',
  MalformedEmail: 'email',
  WeakPassword: 'password',
  BlankFiefName: 'fiefName',
}

const isSignUpField = (key: PropertyKey | undefined): key is SignUpField =>
  key === 'email' || key === 'password' || key === 'fiefName'

const fieldErrorsOf = (request: SignUpRequest): FieldErrors => {
  const parsed = SignUpRequestSchema.safeParse(request)
  if (parsed.success) {
    return {}
  }
  const fields = parsed.error.issues.map((issue) => issue.path[0]).filter(isSignUpField)
  return Object.fromEntries(fields.map((field) => [field, fieldMessages[field]]))
}

export function SignUpScreen(props: SignUpScreenProps): ReactElement {
  const [request, setRequest] = useState<SignUpRequest>({ email: '', password: '', fiefName: '' })
  const [clientErrors, setClientErrors] = useState<FieldErrors>({})
  const refusedField = props.refusal === undefined ? undefined : refusalFields[props.refusal]
  const errors: FieldErrors =
    props.refusal === undefined || refusedField === undefined
      ? clientErrors
      : { ...clientErrors, [refusedField]: refusalLineOf(props.refusal) }
  const formRefusal = refusedField === undefined ? props.refusal : undefined

  const edit =
    (field: SignUpField) =>
    (value: string): void =>
      setRequest((current) => ({ ...current, [field]: value }))

  const submit = (): void => {
    const found = fieldErrorsOf(request)
    setClientErrors(found)
    if (Object.keys(found).length === 0) {
      props.onSubmit(request)
    }
  }

  return (
    <AuthPanel
      title={authSignUpTitle()}
      onSubmit={submit}
      footer={
        <>
          {authSignUpSwitchPrompt()}
          <TextLink to="/sign-in">{authSignUpSwitchLink()}</TextLink>
        </>
      }
    >
      <TextField
        label={authEmail()}
        name="email"
        type="email"
        autoComplete="email"
        value={request.email}
        onChange={edit('email')}
        error={errors.email}
      />
      <TextField
        label={authPassword()}
        name="password"
        type="password"
        autoComplete="new-password"
        value={request.password}
        onChange={edit('password')}
        hint={authSignUpPasswordHint()}
        error={errors.password}
      />
      <TextField
        label={authSignUpFiefName()}
        name="fiefName"
        type="text"
        autoComplete="off"
        value={request.fiefName}
        onChange={edit('fiefName')}
        error={errors.fiefName}
      />
      {formRefusal === undefined ? null : <FormAlert message={refusalLineOf(formRefusal)} />}
      <Button type="submit" tone="primary" disabled={props.isSubmitting}>
        {authSignUpSubmit()}
      </Button>
    </AuthPanel>
  )
}
