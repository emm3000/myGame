import type { UnitKind } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { UnitCount, type UnitTally } from './UnitCount'

export interface UnitCardHeaderProps {
  readonly unit: UnitKind
  readonly name: string
  readonly tallies: ReadonlyArray<UnitTally>
  readonly titleElement: 'h3' | 'h4'
}

export function UnitCardHeader({
  unit,
  name,
  tallies,
  titleElement: Title,
}: UnitCardHeaderProps): ReactElement {
  return (
    <header className="flex flex-wrap items-center justify-between gap-2">
      <Title className="m-0 font-display text-title text-ink">{name}</Title>
      <UnitCount unit={unit} tallies={tallies} />
    </header>
  )
}
