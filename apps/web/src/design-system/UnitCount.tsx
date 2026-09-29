import { Fragment, type ReactElement } from 'react'
import { formatQuantity } from './formatQuantity'
import { InfantryIcon } from './icons/InfantryIcon'

export interface UnitTally {
  readonly count: number
  readonly label: string
}

export function UnitCount({
  tallies,
}: {
  readonly tallies: ReadonlyArray<UnitTally>
}): ReactElement {
  return (
    <span className="flex flex-wrap items-center gap-1 font-utility text-ink tabular-nums">
      <span className="flex text-ink-muted">
        <InfantryIcon />
      </span>
      {tallies.map(({ count, label }, index) => (
        <Fragment key={label}>
          {index > 0 && ' '}
          <span className="whitespace-nowrap text-numeral-lg">
            {formatQuantity(count)} <span className="text-numeral text-ink-muted">{label}</span>
          </span>
        </Fragment>
      ))}
    </span>
  )
}
