import type { ReactElement } from 'react'
import { IconFrame, type IconFrameProps } from './IconFrame'

export function CampIcon({ sizeClass }: Pick<IconFrameProps, 'sizeClass'>): ReactElement {
  return (
    <IconFrame sizeClass={sizeClass}>
      <path d="M12.1 5.2 4.3 19.3c5.2.5 10.3.5 15.5 0z" />
      <path d="M12 19.2c-.1-3-.9-5.5-2.5-7.4" />
      <path d="M12.1 5.2c.1-1.1.1-2.1 0-3.1" />
      <path d="M12.2 2.3c1.1.3 2.2.7 3.2 1.2-1 .5-2.1.9-3.2 1.1" />
    </IconFrame>
  )
}
