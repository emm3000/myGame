import type { TownOverview } from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { LabelText } from '../design-system/LabelText'
import { TextLink } from '../design-system/TextLink'

type DueHoldoutCheck = TownOverview['dueHoldoutChecks'][number]

function HoldoutCheckRow({ check }: { readonly check: DueHoldoutCheck }): ReactElement {
  const lineId = useId()
  const { fixedCopy } = usePlayerCopy()
  return (
    <li className="flex flex-col items-start gap-1 rounded-md border border-line bg-surface-raised p-5">
      <p id={lineId} className="m-0 font-sans text-body text-ink">
        <LabelText
          label={fixedCopy((catalog) =>
            catalog.schoolHoldoutCheckRow({ band: check.band, week: check.week }),
          )}
        />
      </p>
      <TextLink
        to="/school/check/$band/$week"
        params={{ band: String(check.band), week: String(check.week) }}
        aria-describedby={lineId}
      >
        <LabelText label={fixedCopy((catalog) => catalog.schoolHoldoutCheckOpen())} />
      </TextLink>
    </li>
  )
}

export function HoldoutCheckRows({
  checks,
}: {
  readonly checks: ReadonlyArray<DueHoldoutCheck>
}): ReactElement | null {
  if (checks.length === 0) {
    return null
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {checks.map((check) => (
        <HoldoutCheckRow key={`${check.band}-${check.week}`} check={check} />
      ))}
    </ul>
  )
}
