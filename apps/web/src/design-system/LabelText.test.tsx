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

it('names a control by both lines in the both phase', () => {
  render(
    <button type="button">
      <LabelText label={englishOverSpanish} />
    </button>,
  )

  expect(screen.getByRole('button', { name: 'Report Informe' })).toBeDefined()
})

const needWithFigures: Label = {
  text: 'Needs 10 words: 7 of 10',
  language: 'en',
  translation: null,
  figures: [
    { at: 6, text: '10' },
    { at: 16, text: '7' },
    { at: 21, text: '10' },
  ],
}

it('draws each figure of a line as the whole text of its own tabular element', () => {
  render(<LabelText label={needWithFigures} />)

  expect(
    screen
      .getAllByText(/^\d+$/)
      .map((figure) => [figure.textContent, figure.classList.contains('tabular-nums')]),
  ).toEqual([
    ['10', true],
    ['7', true],
    ['10', true],
  ])
})

it("keeps a line's text whole around its figures", () => {
  render(
    <button type="button">
      <LabelText label={needWithFigures} />
    </button>,
  )

  expect(screen.getByRole('button').textContent).toBe('Needs 10 words: 7 of 10')
})

const titleAfterFigure: Label = {
  text: 'Day 2: Lee Report',
  language: 'es',
  translation: null,
  inset: { at: 11, text: 'Report', language: 'en' },
  figures: [{ at: 4, text: '2' }],
}

it('draws an inset and a figure in the order they fall in the line', () => {
  render(
    <button type="button">
      <LabelText label={titleAfterFigure} />
    </button>,
  )

  expect([
    screen.getByRole('button').textContent,
    screen.getByText('Report').getAttribute('lang'),
    screen.getByText('2').classList.contains('tabular-nums'),
  ]).toEqual(['Day 2: Lee Report', 'en', true])
})
