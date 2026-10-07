import type { ReactElement } from 'react'

export interface ChipProps {
  readonly icon: ReactElement
  readonly text: string
  readonly separator: string
}

export function Chip({ icon, text, separator }: ChipProps): ReactElement {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-sm border border-line bg-surface-raised px-1 font-utility text-caption font-semibold text-ink tabular-nums">
      <span className="sr-only">{separator}</span> {icon}
      {text}
    </span>
  )
}
