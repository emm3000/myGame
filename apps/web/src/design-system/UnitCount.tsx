import type { ReactElement } from 'react'
import { formatQuantity } from './formatQuantity'
import { InfantryIcon } from './icons/InfantryIcon'

export function UnitCount({
  count,
  label,
}: {
  readonly count: number
  readonly label: string
}): ReactElement {
  return (
    <span className="flex items-center gap-1 font-utility text-ink tabular-nums">
      <span className="flex text-ink-muted">
        <InfantryIcon />
      </span>
      <span className="whitespace-nowrap text-numeral-lg">
        {formatQuantity(count)} <span className="text-numeral text-ink-muted">{label}</span>
      </span>
    </span>
  )
}
