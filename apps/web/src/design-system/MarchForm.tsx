import { type FormEvent, type ReactElement, useId } from 'react'
import { cardToneOf } from './CardAction'
import { NumberField } from './NumberField'
import { Panel } from './Panel'
import { type PreviewLine, PreviewLines } from './PreviewLines'
import { SubmitAction, type SubmitActionState } from './SubmitAction'
import { UnitCount } from './UnitCount'

export interface MarchFormField {
  readonly label: string
  readonly entry: string
  readonly max?: number | undefined
  readonly onChange: (entry: string) => void
}

export interface MarchFormProps {
  readonly title: string
  readonly count: number
  readonly countLabel: string
  readonly infantry: MarchFormField
  readonly hours?: MarchFormField | undefined
  readonly isFieldDisabled: boolean
  readonly preview: ReadonlyArray<PreviewLine> | undefined
  readonly actionLabel: string
  readonly state: SubmitActionState
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
        min={1}
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
    <div className="w-full max-w-form">
      <Panel element="article" toneClass={cardToneOf(props.state)} spacingClass="gap-3 p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h4 id={titleId} className="m-0 font-display text-title text-ink">
            {props.title}
          </h4>
          <UnitCount tallies={[{ count: props.count, label: props.countLabel }]} />
        </header>
        <form aria-labelledby={titleId} className="m-0 flex flex-col gap-3" onSubmit={submit}>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Field field={props.infantry} isDisabled={props.isFieldDisabled} />
            {props.hours !== undefined && (
              <Field field={props.hours} isDisabled={props.isFieldDisabled} />
            )}
          </div>
          {props.preview !== undefined && <PreviewLines lines={props.preview} />}
          <div className="flex flex-col items-start">
            <SubmitAction
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
