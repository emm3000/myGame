import { screen, within } from '@testing-library/react'

export function slotTrackFill(): string | null {
  const slot = screen.getByRole('timer').closest('section')
  if (slot === null) {
    throw new Error('the busy slot is not a section')
  }
  return within(slot).getByRole('progressbar').getAttribute('aria-valuenow')
}
