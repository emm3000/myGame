import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { ResourceBar, type ResourceBarProps } from './ResourceBar'

function storeWithFullGranary(): ResourceBarProps {
  return {
    resources: [
      { kind: 'wood', label: 'Wood', amount: 12480, ratePerHour: 340, capacity: 20000 },
      { kind: 'food', label: 'Food', amount: 20000, ratePerHour: 120, capacity: 20000 },
    ],
    peasants: { label: 'Peasants', free: 36, supplied: 60, occupied: 24 },
    labels: { full: 'full', free: 'free', occupied: 'occupied' },
  }
}

it('shows a resource bar at capacity', () => {
  render(<ResourceBar {...storeWithFullGranary()} />)

  const granary = screen.getByRole('listitem', { name: 'Food' })
  expect(granary.textContent).toContain('full')
  expect(granary.textContent).not.toContain('+120 / h')
  expect(screen.getByRole('listitem', { name: 'Wood' }).textContent).toContain('+340 / h')
})
