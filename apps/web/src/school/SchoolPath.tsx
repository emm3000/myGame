import {
  schoolPathCount,
  schoolPathLearned,
  schoolPathRead,
  schoolPathReviewed,
  schoolPathStudied,
} from '@mygame/catalog'
import type { WordStanding } from '@mygame/domain'
import type { ReactElement } from 'react'

const standingsInOrder: ReadonlyArray<WordStanding> = [
  'notStarted',
  'recognize',
  'recall',
  'hold',
  'retained',
]

const stepLabels: ReadonlyArray<() => string> = [
  schoolPathStudied,
  schoolPathRead,
  schoolPathReviewed,
  schoolPathLearned,
]

const countPast = (step: number, standings: ReadonlyArray<WordStanding>): number =>
  standings.filter((standing) => standingsInOrder.indexOf(standing) > step).length

export interface SchoolPathProps {
  readonly standings: ReadonlyArray<WordStanding>
}

export function SchoolPath({ standings }: SchoolPathProps): ReactElement | null {
  const held = standings.filter((standing) => standing !== 'notStarted')
  if (held.length === 0) {
    return null
  }
  return (
    <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4">
      {stepLabels.map((labelOf, step) => (
        <div key={labelOf()} className="flex flex-col">
          <dt className="font-sans text-caption text-ink-muted">{labelOf()}</dt>
          <dd className="m-0 font-sans text-body text-ink tabular-nums">
            {schoolPathCount({ count: countPast(step, held), total: held.length })}
          </dd>
        </div>
      ))}
    </dl>
  )
}
