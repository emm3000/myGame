import type { ResetPasswordRequest } from '@mygame/contracts'
import { fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

const chooseNewPassword = async (password: string): Promise<void> => {
  fireEvent.change(await screen.findByLabelText(copy.passwordReset.newPassword.password), {
    target: { value: password },
  })
  fireEvent.click(screen.getByRole('button', { name: copy.passwordReset.newPassword.submit }))
}

it('sets the new password from the link', async () => {
  const resets: ResetPasswordRequest[] = []
  renderAppAt(
    '/reset-password?token=link-token',
    stubApiClient({
      resetPassword: async (request) => {
        resets.push(request)
        return undefined
      },
    }),
  )

  await chooseNewPassword('piedra-nueva')

  expect((await screen.findByRole('status')).textContent).toBe(
    'Tu contraseña ha cambiado y hemos cerrado todas tus sesiones.',
  )
  expect(resets).toEqual([{ token: 'link-token', password: 'piedra-nueva' }])
})

it('shows the 8-character hint under the new password', async () => {
  renderAppAt('/reset-password?token=link-token', stubApiClient())

  const field = await screen.findByLabelText(copy.passwordReset.newPassword.password)
  const hint = screen.getByText('Al menos 8 caracteres.')

  expect(field.getAttribute('aria-describedby')).toBe(hint.id)
})

it('refuses a short new password', async () => {
  let resets = 0
  renderAppAt(
    '/reset-password?token=link-token',
    stubApiClient({
      resetPassword: async () => {
        resets += 1
        return undefined
      },
    }),
  )

  await chooseNewPassword('siete12')

  expect((await screen.findByRole('alert')).textContent).toBe(
    'Tu contraseña necesita al menos 8 caracteres.',
  )
  expect(resets).toBe(0)
})

it('shows the WeakPassword line the api answers', async () => {
  renderAppAt(
    '/reset-password?token=link-token',
    stubApiClient({ resetPassword: async () => 'WeakPassword' }),
  )

  await chooseNewPassword('piedra-nueva')

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.WeakPassword)
})

it('offers a new link when the reset link is refused', async () => {
  renderAppAt(
    '/reset-password?token=used-token',
    stubApiClient({ resetPassword: async () => 'TokenInvalid' }),
  )

  await chooseNewPassword('piedra-nueva')

  expect((await screen.findByRole('alert')).textContent).toBe(
    'Ese enlace no vale: ha caducado, ya se ha usado o nunca se envió. Pide otro.',
  )
  expect(screen.getByRole('link', { name: 'Pedir otro enlace' }).getAttribute('href')).toBe(
    '/forgot-password',
  )
  expect(screen.queryByLabelText(copy.passwordReset.newPassword.password)).toBeNull()
})

it('shows the Spanish line of an unexpected answer to a new password', async () => {
  renderAppAt(
    '/reset-password?token=link-token',
    stubApiClient({ resetPassword: async () => 'Unexpected' }),
  )

  await chooseNewPassword('piedra-nueva')

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.Unexpected)
})

it('shows the invalid link without a request when the token is missing', async () => {
  let resets = 0
  renderAppAt(
    '/reset-password',
    stubApiClient({
      resetPassword: async () => {
        resets += 1
        return undefined
      },
    }),
  )

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.TokenInvalid)
  expect(screen.queryByLabelText(copy.passwordReset.newPassword.password)).toBeNull()
  expect(resets).toBe(0)
})

it('links to sign in after the reset', async () => {
  renderAppAt('/reset-password?token=link-token', stubApiClient())

  await chooseNewPassword('piedra-nueva')

  expect(
    (await screen.findByRole('link', { name: 'Entra en tu feudo' })).getAttribute('href'),
  ).toBe('/sign-in')
})

it('opens the new password screen for a signed-in visitor', async () => {
  renderAppAt(
    '/reset-password?token=link-token',
    stubApiClient({ currentPlayer: async () => knownPlayer }),
  )

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Elige una contraseña nueva' }),
  ).not.toBeNull()
})
