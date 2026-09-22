import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Countdown } from './Countdown'

it('reads minutes and seconds under an hour', () => {
  render(<Countdown remainingSeconds={42} finishedLabel="Done" />)

  expect(screen.getByRole('timer').textContent).toBe('0:42')
})

it('drops the minutes when a whole number of hours remains', () => {
  render(<Countdown remainingSeconds={7200} finishedLabel="Done" />)

  expect(screen.getByRole('timer').textContent).toBe('2 h')
})

it('shows the finished label once no time remains', () => {
  render(<Countdown remainingSeconds={0} finishedLabel="Done" />)

  expect(screen.getByRole('timer').textContent).toBe('Done')
})
