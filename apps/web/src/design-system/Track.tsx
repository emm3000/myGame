import type { ReactElement } from 'react'

interface TrackProps {
  readonly value: number
  readonly total: number
  readonly fillClass: string
  readonly marks?: ReadonlyArray<number>
}

function percentOf(value: number, total: number): number {
  if (total <= 0) {
    return 100
  }
  return Math.round(Math.min(1, Math.max(0, value / total)) * 100)
}

export function Track({ value, total, fillClass, marks = [] }: TrackProps): ReactElement {
  const percent = percentOf(value, total)
  return (
    <svg
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      focusable="false"
      className="block h-track w-full rounded-sm bg-surface-sunken"
    >
      <rect
        width={`${percent}%`}
        height="100%"
        className={`motion-safe:transition-track ${fillClass}`}
      />
      {marks.map((mark) => (
        <rect
          key={mark}
          x={`${percentOf(mark, total)}%`}
          width={2}
          height="100%"
          className="fill-line-strong"
        />
      ))}
    </svg>
  )
}
