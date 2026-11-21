import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { LabelText } from './LabelText'

it('draws a label without a translation as its line alone', () => {
  render(
    <button type="button">
      <LabelText label={{ text: 'Informe', translation: null }} />
    </button>,
  )

  expect(screen.getByRole('button').textContent).toBe('Informe')
})

it('draws the English line over its translation', () => {
  render(<LabelText label={{ text: 'Report', translation: 'Informe' }} />)

  const english = screen.getByText('Report')
  const translation = screen.getByText('Informe')

  expect(english.compareDocumentPosition(translation)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

it('draws the translation in the caption type under the English line', () => {
  render(<LabelText label={{ text: 'Report', translation: 'Informe' }} />)

  expect(screen.getByText('Informe').className.split(' ')).toContain('text-caption')
})

it('names a control by both lines in the both phase', () => {
  render(
    <button type="button">
      <LabelText label={{ text: 'Report', translation: 'Informe' }} />
    </button>,
  )

  expect(screen.getByRole('button', { name: 'Report Informe' })).toBeDefined()
})
