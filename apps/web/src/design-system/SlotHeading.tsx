import type { ReactElement, ReactNode, Ref } from 'react'
import { focusTargetClass } from './focusTargetClass'
import type { Label } from './Label'
import { LabelText } from './LabelText'

export function SlotHeading({
  icon,
  title,
  titleRef,
}: {
  readonly icon: ReactNode
  readonly title: Label
  readonly titleRef?: Ref<HTMLSpanElement> | undefined
}): ReactElement {
  return (
    <span className="flex items-center gap-2">
      {icon}
      <span
        ref={titleRef}
        tabIndex={-1}
        className={`rounded-sm font-sans text-label ${focusTargetClass}`}
      >
        <LabelText label={title} />
      </span>
    </span>
  )
}
