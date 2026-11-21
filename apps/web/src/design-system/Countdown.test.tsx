import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { Countdown } from './Countdown'
import type { Label } from './Label'
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

const done: Label = {
  text: 'Done',
  language: 'en',
  translation: { text: 'Listo', language: 'es' },
}

it('draws its finished label in English and then in Spanish, each in its own language', () => {
  render(<Countdown remainingSeconds={0} time={lineLabelOf('0:00', 'en')} finishedLabel={done} />)

  expect([
    screen.getByText('Done').getAttribute('lang'),
    screen.getByText('Listo').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})
