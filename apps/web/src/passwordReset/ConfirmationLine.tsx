import { type ReactElement, useEffect } from 'react'
import { focusTargetClass } from '../design-system/focusTargetClass'
import { useFocusTarget } from '../focus/useFocusTarget'

export function ConfirmationLine({ line }: { readonly line: string }): ReactElement {
  const { ref, focus } = useFocusTarget<HTMLParagraphElement>()

  useEffect(focus, [focus])

  return (
    <p
      ref={ref}
      role="status"
      tabIndex={-1}
      className={`m-0 rounded-sm font-body text-body text-ink ${focusTargetClass}`}
    >
      {line}
    </p>
  )
}
