import type { ReactElement } from 'react'
import { IconFrame, type IconFrameProps } from './IconFrame'

export function MarchIcon({ sizeClass }: Pick<IconFrameProps, 'sizeClass'>): ReactElement {
  return (
    <IconFrame sizeClass={sizeClass}>
      <path d="M8.4 21.4c.1-5.2.1-10.3.2-15.5" />
      <path d="M8.6 7.3c3.1-.2 6.2-.2 9.3 0l2.5 1.9-2.5 1.9c-3.1.2-6.2.2-9.3 0z" />
      <path d="M4.4 21.3c2.7-.3 5.4-.3 8.1 0" />
      <path d="M6.6 4.1c1.3-.4 2.6-.4 3.9 0" />
    </IconFrame>
  )
}
