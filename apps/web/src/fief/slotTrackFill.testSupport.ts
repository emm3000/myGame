import { screen, within } from '@testing-library/react'

export function busySlot(): HTMLElement {
  const slotTimer = screen.getAllByRole('timer').find((timer) => timer.closest('ol') === null)
  const slot = slotTimer?.closest('section')
  if (slot === null || slot === undefined) {
    throw new Error('the busy slot is not a section')
  }
  return slot
}

export function slotTrackFill(): string | null {
  return within(busySlot()).getByRole('progressbar').getAttribute('aria-valuenow')
}
