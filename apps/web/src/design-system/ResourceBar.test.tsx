import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { copy } from '../copy'
import { ResourceBar, type ResourceBarProps } from './ResourceBar'

function storeWithFullGranary(): ResourceBarProps {
  return {
    resources: [
      { kind: 'wood', label: 'Wood', amount: 12480, ratePerHour: 340, capacity: 20000 },
      { kind: 'food', label: 'Food', amount: 20000, ratePerHour: 120, capacity: 20000 },
    ],
    peasants: { label: 'Peasants', free: 36, supplied: 60, occupied: 24 },
    labels: { full: 'full', free: () => 'free', occupied: () => 'occupied' },
  }
}

function villageWith(supplied: number, occupied: number): ResourceBarProps {
  return {
    resources: [],
    peasants: { label: 'Campesinos', free: supplied - occupied, supplied, occupied },
    labels: { full: copy.fief.full, free: copy.fief.free, occupied: copy.fief.occupied },
  }
}

it('shows a resource bar at capacity', () => {
  render(<ResourceBar {...storeWithFullGranary()} />)

  const granary = screen.getByRole('listitem', { name: 'Food' })
  expect(granary.textContent).toContain('full')
  expect(granary.textContent).not.toContain('+120 / h')
  expect(screen.getByRole('listitem', { name: 'Wood' }).textContent).toContain('+340 / h')
})

it('shows the capacity after the amount', () => {
  render(<ResourceBar {...storeWithFullGranary()} />)

  const woodpile = screen.getByRole('listitem', { name: 'Wood' })
  const amount = within(woodpile).getByText('12 480')
  const capacity = within(woodpile).getByText('/ 20 000')
  expect(amount.compareDocumentPosition(capacity)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

it('keeps showing the capacity when the store is full', () => {
  render(<ResourceBar {...storeWithFullGranary()} />)

  const granary = screen.getByRole('listitem', { name: 'Food' })
  expect(within(granary).getByText('20 000')).toBeDefined()
  expect(within(granary).getByText('/ 20 000')).toBeDefined()
})

it('labels one occupied peasant in the singular', () => {
  render(<ResourceBar {...villageWith(10, 1)} />)

  const village = screen.getByRole('listitem', { name: 'Campesinos' })
  expect(within(village).getByText('1 ocupado')).toBeDefined()
})

it('labels zero occupied peasants in the plural', () => {
  render(<ResourceBar {...villageWith(10, 0)} />)

  const village = screen.getByRole('listitem', { name: 'Campesinos' })
  expect(within(village).getByText('0 ocupados')).toBeDefined()
  expect(within(village).getByText('/ 10 libres')).toBeDefined()
})

it('labels one supplied peasant as libre', () => {
  render(<ResourceBar {...villageWith(1, 0)} />)

  const village = screen.getByRole('listitem', { name: 'Campesinos' })
  expect(within(village).getByText('/ 1 libre')).toBeDefined()
})
