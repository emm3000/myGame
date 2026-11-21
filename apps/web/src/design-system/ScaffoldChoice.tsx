import type { Scaffold } from '@mygame/contracts'
import type { ReactElement } from 'react'

export interface ScaffoldChoiceProps {
  readonly legend: string
  readonly lines: Readonly<Record<Scaffold, string>>
  readonly picked: Scaffold
  readonly isDisabled: boolean
  readonly onPick: (scaffold: Scaffold) => void
}

const scaffolds: ReadonlyArray<Scaffold> = ['es', 'none']

export function ScaffoldChoice(props: ScaffoldChoiceProps): ReactElement {
  const pick = (scaffold: Scaffold): void => {
    if (props.isDisabled) {
      return
    }
    props.onPick(scaffold)
  }
  return (
    <fieldset
      aria-disabled={props.isDisabled}
      className="group m-0 flex flex-col gap-2 border-0 p-0"
    >
      <legend className="mb-1 font-sans text-label text-ink-muted">{props.legend}</legend>
      {scaffolds.map((scaffold) => (
        <label
          key={scaffold}
          className="flex min-h-control cursor-pointer items-center gap-3 rounded-md border border-line-strong bg-surface-raised px-3 py-2 font-sans text-body text-ink has-checked:border-action has-checked:font-bold group-aria-disabled:cursor-not-allowed group-aria-disabled:border-dashed group-aria-disabled:text-ink-muted"
        >
          <input
            type="radio"
            name="scaffold"
            value={scaffold}
            checked={props.picked === scaffold}
            onChange={() => pick(scaffold)}
            className="size-icon accent-action"
          />
          {props.lines[scaffold]}
        </label>
      ))}
    </fieldset>
  )
}
