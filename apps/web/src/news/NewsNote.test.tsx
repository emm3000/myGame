import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { Label } from '../design-system/Label'
import { NewsNote } from './NewsNote'

const noNews: Label = {
  text: 'Nothing new in town.',
  language: 'en',
  translation: { text: 'Nada nuevo en el pueblo.', language: 'es' },
}

it('draws its note in English and then in Spanish, each in its own language', () => {
  render(<NewsNote line={noNews} />)

  expect([
    screen.getByText('Nothing new in town.').getAttribute('lang'),
    screen.getByText('Nada nuevo en el pueblo.').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})
