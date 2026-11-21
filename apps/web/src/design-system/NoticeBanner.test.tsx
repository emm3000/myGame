import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { Label } from './Label'
import { lineLabelOf } from './lineLabelOf'
import { NoticeBanner } from './NoticeBanner'

const unverifiedEmail: Label = {
  text: 'Confirm your email.',
  language: 'en',
  translation: { text: 'Confirma tu correo.', language: 'es' },
}

it('draws its line in English and then in Spanish, each in its own language', () => {
  render(
    <NoticeBanner
      line={unverifiedEmail}
      actionLabel={lineLabelOf('Resend', 'en')}
      isBusy={false}
      onAction={() => undefined}
      outcome={undefined}
    />,
  )

  expect([
    screen.getByText('Confirm your email.').getAttribute('lang'),
    screen.getByText('Confirma tu correo.').getAttribute('lang'),
  ]).toEqual(['en', 'es'])
})
