import {
  townNamingField,
  townNamingGoToTown,
  townNamingMayor,
  townNamingSubmit,
  townNamingTitle,
} from '@mygame/catalog'
import { type FormEvent, type ReactElement, useId } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { Panel } from '../design-system/Panel'
import { TextField } from '../design-system/TextField'
import { refusalLineOf } from '../refusals/refusalLineOf'

export interface NameTownScreenProps {
  readonly name: string
  readonly isSubmitting: boolean
  readonly refusal: ApiRefusal | undefined
  readonly onNameChange: (name: string) => void
  readonly onSubmit: () => void
  readonly onGoToTown: () => void
}

export function NameTownScreen(props: NameTownScreenProps): ReactElement {
  const titleId = useId()
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    props.onSubmit()
  }
  return (
    <Panel
      element="section"
      toneClass="border-line bg-surface-raised"
      spacingClass="gap-4 p-5"
      labelledBy={titleId}
    >
      <h2 id={titleId} className="m-0 font-sans text-display text-ink">
        {townNamingTitle()}
      </h2>
      <p className="m-0 font-sans text-body text-ink">{townNamingMayor()}</p>
      <form aria-labelledby={titleId} className="flex flex-col gap-4" onSubmit={submit}>
        <TextField
          label={townNamingField()}
          name="name"
          type="text"
          autoComplete="off"
          value={props.name}
          onChange={props.onNameChange}
          isDisabled={props.isSubmitting}
        />
        {props.refusal !== undefined && <FormAlert message={refusalLineOf(props.refusal)} />}
        {props.refusal === 'PlayerAlreadyHoldsTown' ? (
          <Button type="button" tone="primary" onClick={props.onGoToTown}>
            {townNamingGoToTown()}
          </Button>
        ) : (
          <Button
            type="submit"
            tone="primary"
            availability={props.isSubmitting ? 'waiting' : 'available'}
          >
            {townNamingSubmit()}
          </Button>
        )}
      </form>
    </Panel>
  )
}
