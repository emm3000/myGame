import type { ResourceKind } from '@mygame/contracts'
import { type ReactElement, useId } from 'react'
import { formatQuantity } from './formatQuantity'
import { resourceAccent } from './resourceAccent'
import { Track } from './Track'

export interface ResourceCell {
  readonly kind: ResourceKind
  readonly label: string
  readonly amount: number
  readonly ratePerHour: number
  readonly capacity: number
}

export interface PeasantCell {
  readonly label: string
  readonly free: number
  readonly supplied: number
  readonly occupied: number
}

export interface ResourceBarProps {
  readonly resources: ReadonlyArray<ResourceCell>
  readonly peasants: PeasantCell
  readonly labels: {
    readonly full: string
    readonly free: (supplied: number) => string
    readonly occupied: (occupied: number) => string
  }
}

const numeralClass = 'font-utility tabular-nums'

function ResourceItem({
  cell,
  fullLabel,
}: {
  readonly cell: ResourceCell
  readonly fullLabel: string
}): ReactElement {
  const labelId = useId()
  const { Icon, textClass, fillClass } = resourceAccent[cell.kind]
  const isFull = cell.amount >= cell.capacity
  return (
    <li aria-labelledby={labelId} className="flex min-w-0 flex-col gap-1">
      <span className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${textClass}`}>
        <Icon />
        <span id={labelId} className="font-utility text-label uppercase">
          {cell.label}
        </span>
      </span>
      <span className={`flex flex-wrap items-baseline gap-x-1 ${numeralClass}`}>
        <span className="whitespace-nowrap text-numeral-lg text-ink">
          {formatQuantity(cell.amount)}
        </span>
        <span className="whitespace-nowrap text-numeral text-ink-muted">
          / {formatQuantity(cell.capacity)}
        </span>
      </span>
      <span className={`${numeralClass} text-numeral ${isFull ? 'text-rust' : 'text-ink-muted'}`}>
        {isFull ? fullLabel : `+${formatQuantity(cell.ratePerHour)} / h`}
      </span>
      <Track
        value={cell.amount}
        total={cell.capacity}
        fillClass={isFull ? 'fill-rust' : fillClass}
      />
    </li>
  )
}

function PeasantItem({
  cell,
  labels,
}: {
  readonly cell: PeasantCell
  readonly labels: ResourceBarProps['labels']
}): ReactElement {
  const labelId = useId()
  const { Icon, textClass } = resourceAccent.peasants
  return (
    <li aria-labelledby={labelId} className="flex min-w-0 flex-col gap-1 border-l border-line pl-3">
      <span className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${textClass}`}>
        <Icon />
        <span id={labelId} className="font-utility text-label uppercase">
          {cell.label}
        </span>
      </span>
      <span className={`${numeralClass} text-numeral-lg text-ink`}>
        {formatQuantity(cell.free)}{' '}
        <span className="text-numeral text-ink-muted">
          / {formatQuantity(cell.supplied)} {labels.free(cell.supplied)}
        </span>
      </span>
      <span className={`${numeralClass} text-numeral text-ink-muted`}>
        {formatQuantity(cell.occupied)} {labels.occupied(cell.occupied)}
      </span>
    </li>
  )
}

export function ResourceBar({ resources, peasants, labels }: ResourceBarProps): ReactElement {
  return (
    <ul className="m-0 grid list-none grid-cols-3 gap-3 rounded-md border border-line bg-surface-raised p-3 shadow-card md:grid-cols-6">
      {resources.map((cell) => (
        <ResourceItem key={cell.kind} cell={cell} fullLabel={labels.full} />
      ))}
      <PeasantItem cell={peasants} labels={labels} />
    </ul>
  )
}
