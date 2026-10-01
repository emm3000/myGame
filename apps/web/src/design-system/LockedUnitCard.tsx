import type { UnitKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { UnitCardHeader } from './UnitCardHeader'
import type { UnitTally } from './UnitCount'

export interface LockedUnitCardProps {
  readonly unit: UnitKind
  readonly name: string
  readonly tallies: ReadonlyArray<UnitTally>
  readonly requirement: string
  readonly reason: string
  readonly titleElement: 'h3' | 'h4'
}

export function LockedUnitCard(props: LockedUnitCardProps): ReactElement {
  return (
    <article className="flex flex-col gap-3 rounded-md border border-line border-dashed bg-surface p-4">
      <UnitCardHeader
        unit={props.unit}
        name={props.name}
        tallies={props.tallies}
        titleElement={props.titleElement}
      />
      <p className="m-0 font-body text-caption text-rust">{props.requirement}</p>
      <p className="m-0 font-body text-caption text-rust">{props.reason}</p>
    </article>
  )
}
