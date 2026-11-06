import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { SeasonLine } from './SeasonLine'

function renderSpringLine(): void {
  render(<SeasonLine season="spring" headerLine="Primavera, año 2" countdownLine="Verano en 0:42" />)
}

it('keeps the digits of the season countdown from jittering as it repaints', () => {
  renderSpringLine()

  expect(screen.getByRole('timer').className.split(' ')).toContain('tabular-nums')
})

it('leaves the season header in proportional figures, since it is a sentence', () => {
  renderSpringLine()

  expect(screen.getByText('Primavera, año 2').className.split(' ')).not.toContain('tabular-nums')
})
