import { schoolBandLine } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import type { ReactElement } from 'react'

export interface BandLinesProps {
  readonly bandLines: TownOverview['bandLines']
}

export function BandLines({ bandLines }: BandLinesProps): ReactElement | null {
  if (bandLines.length === 0) {
    return null
  }
  return (
    <div className="flex flex-col gap-2">
      {bandLines.map(({ band, count, total }) => (
        <p key={band} className="m-0 font-sans text-body text-ink">
          {schoolBandLine({ band, count, total })}
        </p>
      ))}
    </div>
  )
}
