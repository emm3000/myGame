import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { copy } from '../copy'
import { ResourceBar, type ResourceBarProps, type ResourceCell } from './ResourceBar'

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
})

it('labels several supplied peasants as libres', () => {
  render(<ResourceBar {...villageWith(10, 0)} />)

  const village = screen.getByRole('listitem', { name: 'Campesinos' })
  expect(within(village).getByText('/ 10 libres')).toBeDefined()
})

it('labels one supplied peasant as libre', () => {
  render(<ResourceBar {...villageWith(1, 0)} />)

  const village = screen.getByRole('listitem', { name: 'Campesinos' })
  expect(within(village).getByText('/ 1 libre')).toBeDefined()
})

function storeMarked(mark: ResourceCell['mark']): ResourceBarProps {
  return {
    resources: [
      { kind: 'food', label: 'Comida', amount: 14300, ratePerHour: 195, capacity: 20000, mark },
      { kind: 'wood', label: 'Madera', amount: 12480, ratePerHour: 340, capacity: 20000 },
    ],
    peasants: { label: 'Campesinos', free: 36, supplied: 60, occupied: 24 },
    labels: { full: copy.fief.full, free: copy.fief.free, occupied: copy.fief.occupied },
  }
}

it('marks a lowered rate with its effect', () => {
  render(<ResourceBar {...storeMarked({ season: 'winter', words: 'Invierno: -25 % de comida' })} />)

  const granary = screen.getByRole('listitem', { name: 'Comida' })
  const rate = within(granary).getByText('+195 / h')
  const mark = within(granary).getByText('Invierno: -25 % de comida')
  expect(rate.compareDocumentPosition(mark)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

it('marks a raised rate with its effect', () => {
  render(<ResourceBar {...storeMarked({ season: 'autumn', words: 'Otoño: +25 % de oro' })} />)

  const granary = screen.getByRole('listitem', { name: 'Comida' })
  expect(within(granary).getByText('Otoño: +25 % de oro')).toBeDefined()
})

it('marks nothing on a cell without an effect', () => {
  render(<ResourceBar {...storeMarked({ season: 'winter', words: 'Invierno: -25 % de comida' })} />)

  const woodpile = screen.getByRole('listitem', { name: 'Madera' })
  expect(within(woodpile).queryByText(/: [+-]\d+ % de /)).toBeNull()
})

it('draws the art of each resource in its cell', () => {
  render(<ResourceBar {...storeWithFullGranary()} />)

  const sources = ['Wood', 'Food'].map((name) =>
    within(screen.getByRole('listitem', { name })).getByRole('presentation').getAttribute('src'),
  )

  expect(sources).toEqual(['/art/resources/wood-1-96.webp', '/art/resources/food-1-96.webp'])
})

it('draws the peasants icon in a roundel while no peasants art is listed', () => {
  render(<ResourceBar {...villageWith(10, 0)} />)

  const village = screen.getByRole('listitem', { name: 'Campesinos' })
  expect(within(village).queryByRole('presentation')).toBeNull()
  expect(village.querySelector('svg')).not.toBeNull()
})
