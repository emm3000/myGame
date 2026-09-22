import type { ReactElement, ReactNode } from 'react'

export interface PanelProps {
  readonly element: 'article' | 'section'
  readonly toneClass: string
  readonly spacingClass: string
  readonly children: ReactNode
}

export function Panel({
  element: Element,
  toneClass,
  spacingClass,
  children,
}: PanelProps): ReactElement {
  return (
    <Element className={`flex flex-col rounded-md border shadow-card ${spacingClass} ${toneClass}`}>
      {children}
    </Element>
  )
}
