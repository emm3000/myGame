import type { ReactElement, ReactNode, Ref } from 'react'
import { focusTargetClass } from './focusTargetClass'

export function SlotHeading({
  icon,
  title,
  titleRef,
}: {
  readonly icon: ReactNode
  readonly title: string
  readonly titleRef?: Ref<HTMLSpanElement> | undefined
}): ReactElement {
  return (
    <span className="flex items-center gap-2">
      {icon}
      <span
        ref={titleRef}
        tabIndex={-1}
        className={`rounded-sm font-utility text-label uppercase ${focusTargetClass}`}
      >
        {title}
      </span>
    </span>
  )
}
