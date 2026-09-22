import type { ReactElement } from 'react'

interface TrackProps {
  readonly value: number
  readonly total: number
  readonly fillClass: string
}

function percentOf(value: number, total: number): number {
  if (total <= 0) {
    return 100
  }
  return Math.round(Math.min(1, Math.max(0, value / total)) * 100)
}

export function Track({ value, total, fillClass }: TrackProps): ReactElement {
  const percent = percentOf(value, total)
  return (
    <svg
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      focusable="false"
      className="block h-1 w-full rounded-sm bg-surface-sunken"
    >
      <rect width={`${percent}%`} height="100%" className={fillClass} />
    </svg>
  )
}
