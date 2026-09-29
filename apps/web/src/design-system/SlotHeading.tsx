import type { ReactElement, ReactNode } from 'react'

export function SlotHeading({
  icon,
  title,
}: {
  readonly icon: ReactNode
  readonly title: string
}): ReactElement {
  return (
    <span className="flex items-center gap-2">
      {icon}
      <span className="font-utility text-label uppercase">{title}</span>
    </span>
  )
}
