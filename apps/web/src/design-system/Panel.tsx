import type { ReactElement, ReactNode } from 'react'

export interface PanelProps {
  readonly element: 'article' | 'section'
  readonly toneClass: string
  readonly spacingClass: string
  readonly labelledBy?: string
  readonly children: ReactNode
}

export function Panel({
  element: Element,
  toneClass,
  spacingClass,
  labelledBy,
  children,
}: PanelProps): ReactElement {
  return (
    <Element
      aria-labelledby={labelledBy}
      className={`flex flex-col rounded-md shadow-card ${spacingClass} ${toneClass}`}
    >
      {children}
    </Element>
  )
}
