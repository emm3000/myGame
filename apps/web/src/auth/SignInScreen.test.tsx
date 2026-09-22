import { fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { copy } from '../copy'
import { renderAppAt } from './renderAppAt'
import { stubApiClient } from './stubApiClient'

it('shows the Spanish message for a refused credential', async () => {
  renderAppAt(
    '/sign-in',
    stubApiClient({ signIn: async () => ({ ok: false, refusal: 'InvalidCredentials' }) }),
  )

  fireEvent.change(await screen.findByLabelText(copy.auth.email), {
    target: { value: 'aldonza@example.com' },
  })
  fireEvent.change(screen.getByLabelText(copy.auth.password), {
    target: { value: 'piedra-equivocada' },
  })
  fireEvent.click(screen.getByRole('button', { name: copy.auth.signIn.submit }))

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.InvalidCredentials)
})
