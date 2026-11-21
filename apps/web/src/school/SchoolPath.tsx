import type { WordStanding } from '@mygame/domain'
import type { ReactElement } from 'react'
import type { ChromeCatalog } from '../copy/PlayerCopy'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { LabelText } from '../design-system/LabelText'

const standingsInOrder: ReadonlyArray<WordStanding> = [
  'notStarted',
  'recognize',
  'recall',
  'hold',
  'retained',
]

const stepLabels: ReadonlyArray<(catalog: ChromeCatalog) => string> = [
  (catalog) => catalog.schoolPathStudied(),
  (catalog) => catalog.schoolPathRead(),
  (catalog) => catalog.schoolPathReviewed(),
  (catalog) => catalog.schoolPathLearned(),
]

const countPast = (step: number, standings: ReadonlyArray<WordStanding>): number =>
  standings.filter((standing) => standingsInOrder.indexOf(standing) > step).length

export interface SchoolPathProps {
  readonly standings: ReadonlyArray<WordStanding>
}

export function SchoolPath({ standings }: SchoolPathProps): ReactElement | null {
  const { chrome } = usePlayerCopy()
  const held = standings.filter((standing) => standing !== 'notStarted')
  if (held.length === 0) {
    return null
  }
  return (
    <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-4">
      {stepLabels.map((labelOf, step) => (
        <div key={standingsInOrder[step]} className="flex flex-col">
          <dt className="font-sans text-caption text-ink-muted">
            <LabelText label={chrome(labelOf)} />
          </dt>
          <dd className="m-0 font-sans text-body text-ink tabular-nums">
            <LabelText
              label={chrome((catalog) =>
                catalog.schoolPathCount({ count: countPast(step, held), total: held.length }),
              )}
            />
          </dd>
        </div>
      ))}
    </dl>
  )
}
