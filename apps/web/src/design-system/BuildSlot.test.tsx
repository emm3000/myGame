import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { BuildSlot } from './BuildSlot'
import { lineLabelOf } from './lineLabelOf'

it('shows the idle slot with no countdown', () => {
  render(
    <BuildSlot
      state={{
        kind: 'idle',
        title: lineLabelOf('Free slot', 'en'),
        invitation: lineLabelOf('Pick a building to upgrade.', 'en'),
      }}
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
        title: lineLabelOf('Building', 'en'),
        buildingName: lineLabelOf('Sawmill', 'en'),
        levelLabel: lineLabelOf('Lv. 4 → 5', 'en'),
        remainingSeconds: 5880,
        time: lineLabelOf('1 h 38 min · 13:38', 'en'),
        totalSeconds: 20000,
        finishedLabel: lineLabelOf('Done', 'en'),
        cancel: {
          label: lineLabelOf('Cancel', 'en'),
          accessibleName: lineLabelOf('Cancel sawmill', 'en'),
          isWaiting: false,
          onCancel: () => undefined,
        },
        refund: lineLabelOf('Cancelling refunds the whole cost.', 'en'),
      }}
    />,
  )

  expect(screen.getByRole('timer').textContent).toContain('1 h 38 min')
})

it('draws a both-phase title as English over Spanish, each line marked with its language', () => {
  render(
    <BuildSlot
      state={{
        kind: 'idle',
        title: {
          text: 'Free slot',
          language: 'en',
          translation: { text: 'Hueco libre', language: 'es' },
        },
        invitation: lineLabelOf('Pick a building to upgrade.', 'en'),
      }}
    />,
  )

  const english = screen.getByText('Free slot')
  const translation = screen.getByText('Hueco libre')

  expect(english.compareDocumentPosition(translation)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  expect([english.getAttribute('lang'), translation.getAttribute('lang')]).toEqual(['en', 'es'])
})
