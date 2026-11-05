import type { ReactElement } from 'react'
import { IconFrame, type IconFrameProps } from './IconFrame'

export function PeopleIcon({ sizeClass }: Pick<IconFrameProps, 'sizeClass'>): ReactElement {
  return (
    <IconFrame sizeClass={sizeClass}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16.5 14c2.6.3 4.5 2.6 4.5 5.5" />
    </IconFrame>
  )
}
