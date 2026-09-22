import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BuildingCard, type BuildingCardProps } from './BuildingCard'
import { buildingArtOf } from './buildingArtOf'

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
    titleElement: 'h3',
    artSrc: undefined,
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

it('disables an affordable upgrade while another upgrade is being started', () => {
  render(<BuildingCard {...quarryShortOfStone()} state={{ kind: 'affordable' }} isWaiting={true} />)

  expect(screen.getByRole('button', { name: 'Upgrade · 3 h 5 min' }).hasAttribute('disabled')).toBe(
    true,
  )
})

it('titles the card at the heading level it is given', () => {
  render(<BuildingCard {...quarryShortOfStone()} titleElement="h4" />)

  expect(screen.getByRole('heading', { level: 4, name: 'Quarry' })).toBeDefined()
})

it('shows the building art on a card that has one', () => {
  const quarryArt = buildingArtOf('quarry', 6)
  render(<BuildingCard {...quarryShortOfStone()} artSrc={quarryArt} />)

  expect(screen.getByRole('presentation').getAttribute('src')).toBe(quarryArt)
})

it('shows no image on a card without art', () => {
  render(<BuildingCard {...quarryShortOfStone()} artSrc={undefined} />)

  expect(screen.queryByRole('presentation')).toBeNull()
  expect(screen.queryByRole('img')).toBeNull()
})
