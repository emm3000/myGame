import type { ReactElement } from 'react'
import { usePlayerCopy } from '../copy/usePlayerCopy'
import { Button } from '../design-system/Button'
import { ClockIcon } from '../design-system/icons/ClockIcon'
import { LabelText } from '../design-system/LabelText'

export function CheckAction({
  isWaiting,
  isReady,
}: {
  readonly isWaiting: boolean
  readonly isReady: boolean
}): ReactElement {
  const { fixedCopy } = usePlayerCopy()
  if (isWaiting) {
    return (
      <Button type="submit" tone="primary" availability="waiting">
        <ClockIcon sizeClass="size-icon" />
        <LabelText label={fixedCopy((catalog) => catalog.reviewChecking())} />
      </Button>
    )
  }
  return (
    <Button type="submit" tone="primary" availability={isReady ? 'available' : 'blocked'}>
      <LabelText label={fixedCopy((catalog) => catalog.reviewCheck())} />
    </Button>
  )
}
