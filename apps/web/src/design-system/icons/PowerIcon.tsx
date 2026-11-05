import type { ReactElement } from 'react'
import { IconFrame, type IconFrameProps } from './IconFrame'

export function PowerIcon({ sizeClass }: Pick<IconFrameProps, 'sizeClass'>): ReactElement {
  return (
    <IconFrame sizeClass={sizeClass}>
      <path d="M13.5 2.5 5.5 13.5h6l-1 8 8-11h-6z" />
    </IconFrame>
  )
}
