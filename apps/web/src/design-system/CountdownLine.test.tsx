import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { CountdownLine } from './CountdownLine'
import type { Label } from './Label'
import { lineLabelOf } from './lineLabelOf'

const words: Label = {
  text: 'Next review',
  language: 'en',
  translation: { text: 'Próximo repaso', language: 'es' },
}

it('draws the English words over their translation before the time', () => {
  render(<CountdownLine words={words} time={lineLabelOf('13:38', 'en')} />)

  const english = screen.getByText('Next review')
  const translation = screen.getByText('Próximo repaso')

  expect(english.compareDocumentPosition(translation)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  expect(translation.compareDocumentPosition(screen.getByText('13:38'))).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  )
})

it('marks each line of its words with its own language', () => {
  render(<CountdownLine words={words} time={lineLabelOf('13:38', 'en')} />)

  expect([
    screen.getByText('Next review').getAttribute('lang'),
    screen.getByText('Próximo repaso').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})

const tomorrow: Label = {
  text: 'tomorrow 09:10',
  language: 'en',
  translation: { text: 'mañana 09:10', language: 'es' },
}

it('marks each line of its time with its own language', () => {
  render(<CountdownLine words={words} time={tomorrow} />)

  expect([
    screen.getByText('tomorrow 09:10').getAttribute('lang'),
    screen.getByText('mañana 09:10').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})
