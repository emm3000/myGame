import type { ReactElement } from 'react'
import { IconFrame } from './IconFrame'

export function ClockIcon(): ReactElement {
  return (
    <IconFrame>
      <path d="M6.5 3.4h11M6.5 20.6h11" />
      <path d="M7.6 3.6c-.2 3.6 1.3 6.4 4.3 8.3 3-1.9 4.5-4.7 4.3-8.3M7.6 20.4c-.2-3.6 1.3-6.4 4.3-8.3 3 1.9 4.5 4.7 4.3 8.3" />
      <path d="M9.6 6.8c1.6.4 3.1.4 4.7 0M9.3 19.1c1.8-.6 3.6-.6 5.4 0" />
    </IconFrame>
  )
}
