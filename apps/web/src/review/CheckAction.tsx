import { reviewCheck, reviewChecking } from '@mygame/catalog'
import type { ReactElement } from 'react'
import { Button } from '../design-system/Button'
import { ClockIcon } from '../design-system/icons/ClockIcon'

export function CheckAction({
  isWaiting,
  isReady,
}: {
  readonly isWaiting: boolean
  readonly isReady: boolean
}): ReactElement {
  if (isWaiting) {
    return (
      <Button type="submit" tone="primary" availability="waiting">
        <ClockIcon sizeClass="size-icon" />
        <span>{reviewChecking()}</span>
      </Button>
    )
  }
  return (
    <Button type="submit" tone="primary" availability={isReady ? 'available' : 'blocked'}>
      {reviewCheck()}
    </Button>
  )
}
