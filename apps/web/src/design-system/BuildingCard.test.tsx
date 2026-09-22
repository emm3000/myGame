import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BuildingCard, type BuildingCardProps } from './BuildingCard'

function quarryShortOfStone(): BuildingCardProps {
  return {
    name: 'Quarry',
    levelLabel: 'Lv. 6',
    effect: 'Level 7: +330 stone / h',
    costs: [
      { kind: 'wood', amount: 2900, isShort: false },
      { kind: 'stone', amount: 1100, isShort: true },
    ],
    actionLabel: 'Upgrade',
    durationSeconds: 11100,
    state: { kind: 'tooExpensive', reason: 'You lack 985 stone.' },
  }
}

it('marks a building card as too expensive when the cost exceeds the amounts', () => {
  render(<BuildingCard {...quarryShortOfStone()} />)

  expect(
    screen
      .getByRole('button', { name: 'Upgrade · 3 h 5 min. You lack 985 stone.' })
      .hasAttribute('disabled'),
  ).toBe(true)
  expect(screen.getByText('You lack 985 stone.')).toBeDefined()
})

it('offers the upgrade when the building is affordable', () => {
  render(<BuildingCard {...quarryShortOfStone()} state={{ kind: 'affordable' }} />)

  expect(screen.getByRole('button', { name: 'Upgrade · 3 h 5 min' }).hasAttribute('disabled')).toBe(
    false,
  )
})

it('replaces the upgrade with the max level label at max level', () => {
  render(
    <BuildingCard {...quarryShortOfStone()} state={{ kind: 'atMaxLevel', label: 'Max level' }} />,
  )

  expect(screen.getByRole('button', { name: 'Max level' }).hasAttribute('disabled')).toBe(true)
  expect(screen.queryByRole('list')).toBeNull()
})
