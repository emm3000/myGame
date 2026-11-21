import { es } from '@mygame/catalog'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { renderAppAt } from './renderAppAt.testSupport'
import { stubApiClient } from './stubApiClient.testSupport'

beforeEach(() => {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-ES')
})

it('shows the Spanish message for a refused credential', async () => {
  renderAppAt(
    '/sign-in',
    stubApiClient({ signIn: async () => ({ ok: false, refusal: 'InvalidCredentials' }) }),
  )

  fireEvent.change(await screen.findByLabelText(es.authEmail()), {
    target: { value: 'aldonza@example.com' },
  })
  fireEvent.change(screen.getByLabelText(es.authPassword()), {
    target: { value: 'piedra-equivocada' },
  })
  fireEvent.click(screen.getByRole('button', { name: es.authSignInSubmit() }))

  expect((await screen.findByRole('alert')).textContent).toBe(es.refusalInvalidCredentials())
})

it('opens the reset request from the sign-in screen', async () => {
  renderAppAt('/sign-in', stubApiClient())

  fireEvent.click(await screen.findByRole('link', { name: '¿Has olvidado tu contraseña?' }))

  expect(
    (await screen.findByRole('heading', { level: 1, name: 'Recupera tu contraseña' })).textContent,
  ).toBe('Recupera tu contraseña')
})
