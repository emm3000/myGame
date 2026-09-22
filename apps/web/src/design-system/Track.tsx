import type { ReactElement } from 'react'

interface TrackProps {
  readonly fraction: number
  readonly fillClass: string
}

export function Track({ fraction, fillClass }: TrackProps): ReactElement {
  const percent = Math.min(1, Math.max(0, fraction)) * 100
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="block h-1 w-full rounded-sm bg-surface-sunken"
    >
      <rect width={`${percent}%`} height="100%" className={fillClass} />
    </svg>
  )
}
