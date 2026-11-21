import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Countdown } from './Countdown'
import { lineLabelOf } from './lineLabelOf'

it('reads the time of the finish while time remains', () => {
  render(
    <Countdown
      remainingSeconds={7260}
      time={lineLabelOf('2 h 1 min · 16:04', 'en')}
      finishedLabel={lineLabelOf('Done', 'en')}
    />,
  )

  expect(screen.getByRole('timer').textContent).toBe('2 h 1 min · 16:04')
})

it('shows the finished label once no time remains', () => {
  render(
    <Countdown
      remainingSeconds={0}
      time={lineLabelOf('0:00', 'en')}
      finishedLabel={lineLabelOf('Done', 'en')}
    />,
  )

  expect(screen.getByRole('timer').textContent).toBe('Done')
})
