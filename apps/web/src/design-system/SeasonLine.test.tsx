import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { Label } from './Label'
import { lineLabelOf } from './lineLabelOf'
import { SeasonLine } from './SeasonLine'

function renderSpringLine(): void {
  render(
    <SeasonLine
      season="spring"
      headerLine={lineLabelOf('Primavera, año 2', 'es')}
      countdownLine={lineLabelOf('Verano en 0:42', 'es')}
    />,
  )
}

it('keeps the digits of the season countdown from jittering as it repaints', () => {
  renderSpringLine()

  expect(screen.getByRole('timer').className.split(' ')).toContain('tabular-nums')
})

it('leaves the season header in proportional figures, since it is a sentence', () => {
  renderSpringLine()

  expect(screen.getByText('Primavera, año 2').className.split(' ')).not.toContain('tabular-nums')
})

const springHeader: Label = {
  text: 'Spring, year 2',
  language: 'en',
  translation: { text: 'Primavera, año 2', language: 'es' },
}

it('draws its season header in English and then in Spanish, each in its own language', () => {
  render(
    <SeasonLine
      season="spring"
      headerLine={springHeader}
      countdownLine={lineLabelOf('Summer in 0:42', 'en')}
    />,
  )

  expect([
    screen.getByText('Spring, year 2').getAttribute('lang'),
    screen.getByText('Primavera, año 2').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})
