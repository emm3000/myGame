import type { ReactElement } from 'react'
import { IconFrame, type IconFrameProps } from './IconFrame'

export function CrossIcon({ sizeClass }: Pick<IconFrameProps, 'sizeClass'>): ReactElement {
  return (
    <IconFrame sizeClass={sizeClass}>
      <path d="m6 6 12 12M18 6 6 18" />
    </IconFrame>
  )
}
