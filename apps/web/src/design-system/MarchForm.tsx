import type { UnitKind } from '@mygame/contracts'
import { type FormEvent, type ReactElement, type Ref, useId } from 'react'
import { CardAction, cardToneOf, type MarchActionState } from './CardAction'
import { focusTargetClass } from './focusTargetClass'
import { NumberField } from './NumberField'
import { Panel } from './Panel'
import { type PreviewLine, PreviewLines } from './PreviewLines'
import { TextField } from './TextField'
import { UnitCount, type UnitTally } from './UnitCount'

export interface MarchFormField {
  readonly label: string
  readonly entry: string
  readonly min: number
  readonly max?: number | undefined
  readonly onChange: (entry: string) => void
}

export interface MarchFormTextField {
  readonly label: string
  readonly entry: string
  readonly onChange: (entry: string) => void
}

export interface MarchFormAtHome {
  readonly unit: UnitKind
  readonly tally: UnitTally
}

export interface MarchFormProps {
  readonly title: string
  readonly titleRef?: Ref<HTMLHeadingElement> | undefined
  readonly artSrc?: string | undefined
  readonly atHome: ReadonlyArray<MarchFormAtHome>
  readonly counts: ReadonlyArray<MarchFormField>
  readonly amounts?: ReadonlyArray<MarchFormField> | undefined
  readonly hours?: MarchFormField | undefined
  readonly name?: MarchFormTextField | undefined
  readonly isFieldDisabled: boolean
  readonly preview: ReadonlyArray<PreviewLine> | undefined
  readonly actionLabel: string
  readonly state: MarchActionState
  readonly isWaiting: boolean
  readonly onSend: () => void
}

function Field({
  field,
  isDisabled,
}: {
  readonly field: MarchFormField
  readonly isDisabled: boolean
}): ReactElement {
  const fieldId = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="font-utility text-label text-ink-muted uppercase">
        {field.label}
      </label>
      <NumberField
        id={fieldId}
        min={field.min}
        max={field.max}
        value={field.entry}
        isDisabled={isDisabled}
        onChange={field.onChange}
      />
    </div>
  )
}

export function MarchForm(props: MarchFormProps): ReactElement {
  const titleId = useId()
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (props.state.kind === 'affordable' && !props.isWaiting) {
      props.onSend()
    }
  }
  return (
    <div className="w-full">
      <Panel element="article" toneClass={cardToneOf(props.state)} spacingClass="gap-3 p-4">
        {props.artSrc !== undefined && (
          <img
            src={props.artSrc}
            alt=""
            width={768}
            height={768}
            loading="lazy"
            decoding="async"
            className="aspect-4/3 w-full rounded-md object-cover"
          />
        )}
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h4
            id={titleId}
            ref={props.titleRef}
            tabIndex={-1}
            className={`m-0 rounded-sm font-display text-title text-ink ${focusTargetClass}`}
          >
            {props.title}
          </h4>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {props.atHome.map(({ unit, tally }) => (
              <UnitCount key={unit} unit={unit} tallies={[tally]} />
            ))}
          </span>
        </header>
        <form aria-labelledby={titleId} className="m-0 flex flex-col gap-3" onSubmit={submit}>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {props.counts.map((field) => (
              <Field key={field.label} field={field} isDisabled={props.isFieldDisabled} />
            ))}
            {props.hours !== undefined && (
              <Field field={props.hours} isDisabled={props.isFieldDisabled} />
            )}
            {props.name !== undefined && (
              <div className="flex w-full flex-col">
                <TextField
                  label={props.name.label}
                  name="name"
                  type="text"
                  autoComplete="off"
                  value={props.name.entry}
                  isDisabled={props.isFieldDisabled}
                  onChange={props.name.onChange}
                />
              </div>
            )}
          </div>
          {props.amounts !== undefined && (
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {props.amounts.map((field) => (
                <Field key={field.label} field={field} isDisabled={props.isFieldDisabled} />
              ))}
            </div>
          )}
          {props.preview !== undefined && <PreviewLines lines={props.preview} />}
          <div className="flex flex-col items-start">
            <CardAction
              type="submit"
              label={props.actionLabel}
              state={props.state}
              isWaiting={props.isWaiting}
            />
          </div>
        </form>
      </Panel>
    </div>
  )
}
