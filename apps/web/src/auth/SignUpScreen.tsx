import { type Scaffold, type SignUpRequest, SignUpRequestSchema } from '@mygame/contracts'
import { type ReactElement, useState } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import type { Catalog } from '../copy/PlayerCopy'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { LabelText } from '../design-system/LabelText'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { ScaffoldChoice } from '../design-system/ScaffoldChoice'
import { TextField } from '../design-system/TextField'
import { TextLink } from '../design-system/TextLink'
import { refusalLineOf } from '../refusals/refusalLineOf'
import { AuthPanel } from './AuthPanel'
import type { SignedOutCopy } from './SignedOutCopy'

type SignUpField = Exclude<keyof SignUpRequest, 'scaffold'>

type Credentials = Pick<SignUpRequest, SignUpField>

type FieldRefusals = Partial<Record<SignUpField, ApiRefusal>>

export interface SignUpScreenProps {
  readonly copy: SignedOutCopy
  readonly refusal: ApiRefusal | undefined
  readonly isSubmitting: boolean
  readonly onSubmit: (request: SignUpRequest) => void
}

const fieldRefusals: Readonly<Record<SignUpField, ApiRefusal>> = {
  email: 'MalformedEmail',
  password: 'WeakPassword',
}

const refusalFields: Partial<Record<ApiRefusal, SignUpField>> = {
  EmailTaken: 'email',
  MalformedEmail: 'email',
  WeakPassword: 'password',
}

const isSignUpField = (key: PropertyKey | undefined): key is SignUpField =>
  key === 'email' || key === 'password'

const fieldRefusalsOf = (request: SignUpRequest): FieldRefusals => {
  const parsed = SignUpRequestSchema.safeParse(request)
  if (parsed.success) {
    return {}
  }
  const fields = parsed.error.issues.map((issue) => issue.path[0]).filter(isSignUpField)
  return Object.fromEntries(fields.map((field) => [field, fieldRefusals[field]]))
}

const scaffoldLinesOf = (catalog: Catalog): Readonly<Record<Scaffold, string>> => ({
  es: catalog.scaffoldEs(),
  none: catalog.scaffoldNone(),
})

export function SignUpScreen(props: SignUpScreenProps): ReactElement {
  const { catalog, language } = props.copy
  const [credentials, setCredentials] = useState<Credentials>({ email: '', password: '' })
  const [pickedScaffold, setPickedScaffold] = useState<Scaffold | undefined>(undefined)
  const [clientRefusals, setClientRefusals] = useState<FieldRefusals>({})
  const scaffold = pickedScaffold ?? (language === 'es' ? 'es' : 'none')
  const request: SignUpRequest = { ...credentials, scaffold }
  const refusedField = props.refusal === undefined ? undefined : refusalFields[props.refusal]
  const refusals: FieldRefusals =
    refusedField === undefined
      ? clientRefusals
      : { ...clientRefusals, [refusedField]: props.refusal }
  const formRefusal = refusedField === undefined ? props.refusal : undefined
  const errorOf = (field: SignUpField): string | undefined => {
    const refusal = refusals[field]
    return refusal === undefined ? undefined : refusalLineOf(catalog, refusal)
  }

  const edit =
    (field: SignUpField) =>
    (value: string): void =>
      setCredentials((current) => ({ ...current, [field]: value }))

  const submit = (): void => {
    const found = fieldRefusalsOf(request)
    setClientRefusals(found)
    if (Object.keys(found).length === 0) {
      props.onSubmit(request)
    }
  }

  return (
    <AuthPanel
      copy={props.copy}
      title={catalog.authSignUpTitle()}
      lead={catalog.authTagline()}
      onSubmit={submit}
      footer={
        <>
          {catalog.authSignUpSwitchPrompt()}
          <TextLink to="/sign-in">{catalog.authSignUpSwitchLink()}</TextLink>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <ScaffoldChoice
          legend={catalog.scaffoldLabel()}
          lines={scaffoldLinesOf(catalog)}
          picked={scaffold}
          isDisabled={props.isSubmitting}
          onPick={setPickedScaffold}
        />
        <p className="m-0 font-sans text-caption text-ink-muted">
          <LabelText label={lineLabelOf(catalog.authSignUpScaffoldChange(), language)} />
        </p>
      </div>
      <TextField
        label={lineLabelOf(catalog.authEmail(), language)}
        name="email"
        type="email"
        autoComplete="email"
        value={credentials.email}
        onChange={edit('email')}
        error={errorOf('email')}
      />
      <TextField
        label={lineLabelOf(catalog.authPassword(), language)}
        name="password"
        type="password"
        autoComplete="new-password"
        value={credentials.password}
        onChange={edit('password')}
        hint={lineLabelOf(catalog.authSignUpPasswordHint(), language)}
        error={errorOf('password')}
      />
      {formRefusal === undefined ? null : (
        <FormAlert message={lineLabelOf(refusalLineOf(catalog, formRefusal), language)} />
      )}
      <Button type="submit" tone="primary" disabled={props.isSubmitting}>
        {catalog.authSignUpSubmit()}
      </Button>
    </AuthPanel>
  )
}
