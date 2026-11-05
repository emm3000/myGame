import {
  authEmail,
  authPassword,
  authSignInSubmit,
  refusalInvalidCredentials,
} from '@mygame/catalog'
import { fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderAppAt } from './renderAppAt.testSupport'
import { stubApiClient } from './stubApiClient.testSupport'

it('shows the Spanish message for a refused credential', async () => {
  renderAppAt(
    '/sign-in',
    stubApiClient({ signIn: async () => ({ ok: false, refusal: 'InvalidCredentials' }) }),
  )

  fireEvent.change(await screen.findByLabelText(authEmail()), {
    target: { value: 'aldonza@example.com' },
  })
  fireEvent.change(screen.getByLabelText(authPassword()), {
    target: { value: 'piedra-equivocada' },
  })
  fireEvent.click(screen.getByRole('button', { name: authSignInSubmit() }))

  expect((await screen.findByRole('alert')).textContent).toBe(refusalInvalidCredentials())
})

it('opens the reset request from the sign-in screen', async () => {
  renderAppAt('/sign-in', stubApiClient())

  fireEvent.click(await screen.findByRole('link', { name: '¿Has olvidado tu contraseña?' }))

  expect(
    (await screen.findByRole('heading', { level: 1, name: 'Recupera tu contraseña' })).textContent,
  ).toBe('Recupera tu contraseña')
})
