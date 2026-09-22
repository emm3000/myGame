import type { ReactElement } from 'react'
import { IconFrame } from './IconFrame'

export function WoodIcon(): ReactElement {
  return (
    <IconFrame>
      <path d="M4.5 8.2c-1.6.3-1.7 7.1 0 7.5l13.6.6c.9-.8 1.2-6.6.3-8.1z" />
      <ellipse cx="18.6" cy="12.1" rx="2.1" ry="4" />
      <path d="M18.6 10.4c-.5.4-.6 2.9 0 3.4M8 9.3l.4 5.6M12.4 8.9l-.3 6.2" />
    </IconFrame>
  )
}
