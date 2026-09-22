import type { ReactElement } from 'react'
import { IconFrame } from './IconFrame'

export function SlotIcon(): ReactElement {
  return (
    <IconFrame>
      <path d="M4.3 5.1c5.1-.6 10.2-.6 15.3 0 .4 4.6.4 9.2 0 13.8-5.1.5-10.2.5-15.3 0-.4-4.6-.4-9.2 0-13.8z" />
      <path d="M4.6 5.3 19.3 18.7M19.4 5.3 4.7 18.8" />
      <path d="M8.1 3.2v2M15.9 3.2v2" />
    </IconFrame>
  )
}
