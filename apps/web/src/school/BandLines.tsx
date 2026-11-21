import type { TownOverview } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { LabelText } from '../design-system/LabelText'

export interface BandLinesProps {
  readonly bandLines: TownOverview['bandLines']
  readonly hasBandStarted: boolean
}

export function BandLines({ bandLines, hasBandStarted }: BandLinesProps): ReactElement {
  const { fixedCopy } = usePlayerCopy()
  return (
    <>
      {bandLines.length > 0 && (
        <div className="flex flex-col gap-2">
          {bandLines.map(({ band, count, total }) => (
            <p key={band} className="m-0 font-sans text-body text-ink">
              <LabelText
                label={fixedCopy((catalog) => catalog.schoolBandLine({ band, count, total }))}
              />
            </p>
          ))}
        </div>
      )}
      {hasBandStarted && (
        <p className="m-0 font-sans text-body text-ink-muted">
          <LabelText label={fixedCopy((catalog) => catalog.schoolHoldoutNote())} />
        </p>
      )}
    </>
  )
}
