import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { CountdownLine } from './CountdownLine'
import type { Label } from './Label'

const words: Label = {
  text: 'Next review',
  language: 'en',
  translation: { text: 'Próximo repaso', language: 'es' },
}

it('draws the English words over their translation before the time', () => {
  render(<CountdownLine words={words} time="13:38" />)

  const english = screen.getByText('Next review')
  const translation = screen.getByText('Próximo repaso')

  expect(english.compareDocumentPosition(translation)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  expect(translation.compareDocumentPosition(screen.getByText('13:38'))).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  )
})

it('marks each line of its words with its own language', () => {
  render(<CountdownLine words={words} time="13:38" />)

  expect([
    screen.getByText('Next review').getAttribute('lang'),
    screen.getByText('Próximo repaso').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})
