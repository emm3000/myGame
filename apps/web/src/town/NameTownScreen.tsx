import { type FormEvent, type ReactElement, useId } from 'react'
import type { ApiRefusal } from '../api/apiClient'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Button } from '../design-system/Button'
import { FormAlert } from '../design-system/FormAlert'
import { LabelText } from '../design-system/LabelText'
import { Panel } from '../design-system/Panel'
import { PlaceArt } from '../design-system/PlaceArt'
import { placeArtOf } from '../design-system/placeArtOf'
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

const artSizeClass = 'size-thumbnail md:size-place-card'

export function NameTownScreen(props: NameTownScreenProps): ReactElement {
  const titleId = useId()
  const copy = usePlayerCopy()
  const { refusal } = props
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
      <div className="flex justify-center gap-4">
        <PlaceArt shapes={placeArtOf('homes', 0)} sizeClass={artSizeClass} />
        <PlaceArt shapes={placeArtOf('school', 0)} sizeClass={artSizeClass} />
      </div>
      <h2 id={titleId} className="m-0 font-sans text-display text-ink">
        <LabelText label={copy.chrome((catalog) => catalog.townNamingTitle())} />
      </h2>
      <p className="m-0 font-sans text-body text-ink">
        <LabelText label={copy.chrome((catalog) => catalog.townNamingMayor())} />
      </p>
      <form aria-labelledby={titleId} className="flex flex-col gap-4" onSubmit={submit}>
        <TextField
          label={copy.chrome((catalog) => catalog.townNamingField())}
          name="name"
          type="text"
          autoComplete="off"
          value={props.name}
          onChange={props.onNameChange}
          isDisabled={props.isSubmitting}
        />
        {refusal !== undefined && (
          <FormAlert message={copy.fixedCopy((catalog) => refusalLineOf(catalog, refusal))} />
        )}
        {props.refusal === 'PlayerAlreadyHoldsTown' ? (
          <Button type="button" tone="primary" onClick={props.onGoToTown}>
            <LabelText label={copy.chrome((catalog) => catalog.townNamingGoToTown())} />
          </Button>
        ) : (
          <Button
            type="submit"
            tone="primary"
            availability={props.isSubmitting ? 'waiting' : 'available'}
          >
            <LabelText label={copy.chrome((catalog) => catalog.townNamingSubmit())} />
          </Button>
        )}
      </form>
    </Panel>
  )
}
