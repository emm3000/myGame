import type { ReactElement } from 'react'

export interface LiveRegionProps {
  readonly line: string
  readonly sequence: number
}

export function LiveRegion({ line, sequence }: LiveRegionProps): ReactElement {
  return (
    <div aria-live="polite" className="sr-only">
      <span key={sequence}>{line}</span>
    </div>
  )
}
