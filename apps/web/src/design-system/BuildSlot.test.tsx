import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BuildSlot } from './BuildSlot'

it('shows the idle slot with no countdown', () => {
  render(
    <BuildSlot
      state={{ kind: 'idle', title: 'Free slot', invitation: 'Pick a building to upgrade.' }}
    />,
  )

  expect(screen.getByText('Pick a building to upgrade.')).toBeDefined()
  expect(screen.queryByRole('timer')).toBeNull()
})

it('shows the busy slot with its countdown', () => {
  render(
    <BuildSlot
      state={{
        kind: 'busy',
        title: 'Building',
        buildingName: 'Sawmill',
        levelLabel: 'Lv. 4 → 5',
        remainingSeconds: 5880,
        totalSeconds: 20000,
        finishedLabel: 'Done',
        cancel: { label: 'Cancel', isWaiting: false, onCancel: () => undefined },
      }}
    />,
  )

  expect(screen.getByRole('timer').textContent).toContain('1 h 38 min')
})
