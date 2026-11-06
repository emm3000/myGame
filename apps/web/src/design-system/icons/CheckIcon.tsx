import type { ReactElement } from 'react'
import { IconFrame, type IconFrameProps } from './IconFrame'

export function CheckIcon({ sizeClass }: Pick<IconFrameProps, 'sizeClass'>): ReactElement {
  return (
    <IconFrame sizeClass={sizeClass}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </IconFrame>
  )
}
