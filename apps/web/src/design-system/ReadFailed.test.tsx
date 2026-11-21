import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { Label } from './Label'
import { ReadFailed } from './ReadFailed'

const message: Label = {
  text: 'We could not read your town.',
  language: 'en',
  translation: { text: 'No hemos podido leer tu pueblo.', language: 'es' },
}

const retry: Label = {
  text: 'Try again',
  language: 'en',
  translation: { text: 'Volver a intentarlo', language: 'es' },
}

const showReadFailed = (): void => {
  render(<ReadFailed message={message} retryLabel={retry} onRetry={() => undefined} />)
}

it('names its retry button by the English line and its translation', () => {
  showReadFailed()

  expect(screen.getByRole('button', { name: 'Try again Volver a intentarlo' })).toBeDefined()
})

it('marks each line of its alert with its own language', () => {
  showReadFailed()

  expect([
    screen.getByText('We could not read your town.').getAttribute('lang'),
    screen.getByText('No hemos podido leer tu pueblo.').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})
