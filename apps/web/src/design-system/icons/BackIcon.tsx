import type { ReactElement } from 'react'
import { IconFrame, type IconFrameProps } from './IconFrame'

export function BackIcon({ sizeClass }: Pick<IconFrameProps, 'sizeClass'>): ReactElement {
  return (
    <IconFrame sizeClass={sizeClass}>
      <path d="m15 6-6 6 6 6" />
    </IconFrame>
  )
}
