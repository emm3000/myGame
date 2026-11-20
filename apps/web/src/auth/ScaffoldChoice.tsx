import {
  authSignUpScaffoldEs,
  authSignUpScaffoldLabel,
  authSignUpScaffoldNone,
} from '@mygame/catalog'
import type { Scaffold } from '@mygame/contracts'
import type { ReactElement } from 'react'

export interface ScaffoldChoiceProps {
  readonly picked: Scaffold
  readonly isDisabled: boolean
  readonly onPick: (scaffold: Scaffold) => void
}

const scaffoldLines: Readonly<Record<Scaffold, string>> = {
  es: authSignUpScaffoldEs(),
  none: authSignUpScaffoldNone(),
}

const scaffolds: ReadonlyArray<Scaffold> = ['es', 'none']

export function ScaffoldChoice(props: ScaffoldChoiceProps): ReactElement {
  return (
    <fieldset disabled={props.isDisabled} className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-1 font-sans text-label text-ink-muted">
        {authSignUpScaffoldLabel()}
      </legend>
      {scaffolds.map((scaffold) => (
        <label
          key={scaffold}
          className="flex min-h-control cursor-pointer items-center gap-3 rounded-md border border-line-strong bg-surface-raised px-3 py-2 font-sans text-body text-ink has-checked:border-action has-checked:font-bold has-disabled:cursor-not-allowed has-disabled:border-dashed has-disabled:text-ink-muted"
        >
          <input
            type="radio"
            name="scaffold"
            value={scaffold}
            checked={props.picked === scaffold}
            onChange={() => props.onPick(scaffold)}
            className="size-icon accent-action"
          />
          {scaffoldLines[scaffold]}
        </label>
      ))}
    </fieldset>
  )
}
