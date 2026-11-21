import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { Label } from './Label'
import { TextField } from './TextField'

const emailLabel: Label = {
  text: 'Email',
  language: 'en',
  translation: { text: 'Correo', language: 'es' },
}

const emailHint: Label = {
  text: 'We never share it.',
  language: 'en',
  translation: { text: 'Nunca lo compartimos.', language: 'es' },
}

const showField = (): void => {
  render(
    <TextField
      label={emailLabel}
      hint={emailHint}
      name="email"
      type="email"
      autoComplete="email"
      value=""
      onChange={() => undefined}
    />,
  )
}

it('names its input by the English line and its translation', () => {
  showField()

  expect(screen.getByRole('textbox', { name: 'Email Correo' })).toBeDefined()
})

it('marks each line of its label with its own language', () => {
  showField()

  expect([
    screen.getByText('Email').getAttribute('lang'),
    screen.getByText('Correo').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})

it('describes its input by both lines of the hint', () => {
  showField()

  expect(
    screen.getByRole('textbox', { description: 'We never share it. Nunca lo compartimos.' }),
  ).toBeDefined()
})
