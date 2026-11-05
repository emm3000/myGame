import type { ReactElement } from 'react'
import { IconFrame, type IconFrameProps } from './IconFrame'

export function MaterialIcon({ sizeClass }: Pick<IconFrameProps, 'sizeClass'>): ReactElement {
  return (
    <IconFrame sizeClass={sizeClass}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M12 9.7v4.6M8 14.3V19M16 14.3V19" />
    </IconFrame>
  )
}
