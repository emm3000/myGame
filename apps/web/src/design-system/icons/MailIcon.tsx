import type { ReactElement } from 'react'
import { IconFrame } from './IconFrame'

export function MailIcon(): ReactElement {
  return (
    <IconFrame sizeClass="size-6">
      <path d="M3.6 6.4c5.6-.5 11.2-.5 16.8 0 .4 3.7.4 7.4 0 11.2-5.6.5-11.2.5-16.8 0-.4-3.8-.4-7.5 0-11.2z" />
      <path d="M3.8 6.8 12 13.1l8.2-6.3" />
      <path d="M3.9 17.4l5.7-5.4M20.1 17.4l-5.7-5.4" />
    </IconFrame>
  )
}
