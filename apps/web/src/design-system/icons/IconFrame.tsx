import type { ReactElement, ReactNode } from 'react'
import { strokeWidths } from '../../design/tokens'

export interface IconFrameProps {
  readonly children: ReactNode
  readonly sizeClass?: string | undefined
}

export function IconFrame({ children, sizeClass = 'size-4' }: IconFrameProps): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidths.icon}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`${sizeClass} shrink-0`}
    >
      {children}
    </svg>
  )
}
