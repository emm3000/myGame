import type { TownOverview } from '@mygame/contracts'
import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { LabelText } from '../design-system/LabelText'

export interface BandLinesProps {
  readonly bandLines: TownOverview['bandLines']
}

export function BandLines({ bandLines }: BandLinesProps): ReactElement | null {
  const { fixedCopy } = usePlayerCopy()
  if (bandLines.length === 0) {
    return null
  }
  return (
    <div className="flex flex-col gap-2">
      {bandLines.map(({ band, count, total }) => (
        <p key={band} className="m-0 font-sans text-body text-ink">
          <LabelText
            label={fixedCopy((catalog) => catalog.schoolBandLine({ band, count, total }))}
          />
        </p>
      ))}
    </div>
  )
}
