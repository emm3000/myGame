import {
  authEmail,
  authPassword,
  authSignUpPasswordHint,
  authSignUpSubmit,
  authSignUpSwitchLink,
  authSignUpSwitchPrompt,
  authSignUpTitle,
  authTagline,
  es,
  refusalMalformedEmail,
  refusalWeakPassword,
  scaffoldEs,
  scaffoldLabel,
  scaffoldNone,
} from '@mygame/catalog'
import { type Scaffold, type SignUpRequest, SignUpRequestSchema } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { ScaffoldChoice } from '../design-system/ScaffoldChoice'
import { TextField } from '../design-system/TextField'
import { TextLink } from '../design-system/TextLink'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { AuthPanel } from './AuthPanel'

const scaffoldLines: Readonly<Record<Scaffold, string>> = {
  es: scaffoldEs(),
  none: scaffoldNone(),
}

type SignUpField = Exclude<keyof SignUpRequest, 'scaffold'>

type FieldErrors = Partial<Record<SignUpField, string>>

export interface SignUpScreenProps {
  readonly refusal: ApiRefusal | undefined
  readonly isSubmitting: boolean
  readonly preselectedScaffold: Scaffold
  readonly onScaffoldPick: (scaffold: Scaffold) => void
  readonly onSubmit: (request: SignUpRequest) => void
}

const fieldMessages: Readonly<Record<SignUpField, string>> = {
  email: refusalMalformedEmail(),
  password: refusalWeakPassword(),
}

const refusalFields: Partial<Record<ApiRefusal, SignUpField>> = {
  EmailTaken: 'email',
  MalformedEmail: 'email',
  WeakPassword: 'password',
}

const isSignUpField = (key: PropertyKey | undefined): key is SignUpField =>
  key === 'email' || key === 'password'

const fieldErrorsOf = (request: SignUpRequest): FieldErrors => {
  const parsed = SignUpRequestSchema.safeParse(request)
  if (parsed.success) {
    return {}
  }
  const fields = parsed.error.issues.map((issue) => issue.path[0]).filter(isSignUpField)
  return Object.fromEntries(fields.map((field) => [field, fieldMessages[field]]))
}

export function SignUpScreen(props: SignUpScreenProps): ReactElement {
  const [request, setRequest] = useState<SignUpRequest>({
    email: '',
    password: '',
    scaffold: props.preselectedScaffold,
  })
  const [clientErrors, setClientErrors] = useState<FieldErrors>({})
  const refusedField = props.refusal === undefined ? undefined : refusalFields[props.refusal]
  const errors: FieldErrors =
    props.refusal === undefined || refusedField === undefined
      ? clientErrors
      : { ...clientErrors, [refusedField]: refusalLineOf(es, props.refusal) }
  const formRefusal = refusedField === undefined ? props.refusal : undefined

  const edit =
    (field: SignUpField) =>
    (value: string): void =>
      setRequest((current) => ({ ...current, [field]: value }))

  const pick = (scaffold: Scaffold): void => {
    setRequest((current) => ({ ...current, scaffold }))
    props.onScaffoldPick(scaffold)
  }

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
      lead={authTagline()}
      onSubmit={submit}
      footer={
        <>
          {authSignUpSwitchPrompt()}
          <TextLink to="/sign-in">{authSignUpSwitchLink()}</TextLink>
        </>
      }
    >
      <ScaffoldChoice
        legend={scaffoldLabel()}
        lines={scaffoldLines}
        picked={request.scaffold}
        isDisabled={props.isSubmitting}
        onPick={pick}
      />
      <TextField
        label={lineLabelOf(authEmail(), 'es')}
        name="email"
        type="email"
        autoComplete="email"
        value={request.email}
        onChange={edit('email')}
        error={errors.email}
      />
      <TextField
        label={lineLabelOf(authPassword(), 'es')}
        name="password"
        type="password"
        autoComplete="new-password"
        value={request.password}
        onChange={edit('password')}
        hint={lineLabelOf(authSignUpPasswordHint(), 'es')}
        error={errors.password}
      />
      {formRefusal === undefined ? null : (
        <FormAlert message={lineLabelOf(refusalLineOf(es, formRefusal), 'es')} />
      )}
      <Button type="submit" tone="primary" disabled={props.isSubmitting}>
        {authSignUpSubmit()}
      </Button>
    </AuthPanel>
  )
}
