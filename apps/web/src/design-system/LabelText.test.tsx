import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { Label } from './Label'
import { LabelText } from './LabelText'

const spanishAlone: Label = { text: 'Informe', language: 'es', translation: null }

const englishAlone: Label = { text: 'Report', language: 'en', translation: null }

const englishOverSpanish: Label = {
  text: 'Report',
  language: 'en',
  translation: { text: 'Informe', language: 'es' },
}

it('draws a label without a translation as its line alone', () => {
  render(
    <button type="button">
      <LabelText label={spanishAlone} />
    </button>,
  )

  expect(screen.getByRole('button').textContent).toBe('Informe')
})

it('marks a line alone with its language', () => {
  render(<LabelText label={englishAlone} />)

  expect(screen.getByText('Report').getAttribute('lang')).toBe('en')
})

it('draws the English line over its translation', () => {
  render(<LabelText label={englishOverSpanish} />)

  const english = screen.getByText('Report')
  const translation = screen.getByText('Informe')

  expect(english.compareDocumentPosition(translation)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

it('marks each line of a translated label with its own language', () => {
  render(<LabelText label={englishOverSpanish} />)

  expect([
    screen.getByText('Report').getAttribute('lang'),
    screen.getByText('Informe').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})

it('draws the translation in the caption type under the English line', () => {
  render(<LabelText label={englishOverSpanish} />)

  expect(screen.getByText('Informe').className.split(' ')).toContain('text-caption')
})

it('names a control by both lines in the both phase', () => {
  render(
    <button type="button">
      <LabelText label={englishOverSpanish} />
    </button>,
  )

  expect(screen.getByRole('button', { name: 'Report Informe' })).toBeDefined()
})
