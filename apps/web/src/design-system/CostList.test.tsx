import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { CostList } from './CostList'
import type { Label } from './Label'

const food: Label = {
  text: 'food',
  language: 'en',
  translation: { text: 'comida', language: 'es' },
}

it('names a cost in English and then in Spanish, each in its own language', () => {
  render(
    <CostList costs={[{ kind: 'food', amount: 40, spokenName: food, shortMark: undefined }]} />,
  )

  expect([
    screen.getByText('food').getAttribute('lang'),
    screen.getByText('comida').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})
