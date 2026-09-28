import { fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { stubApiClient } from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

const askForReset = async (email: string): Promise<void> => {
  fireEvent.change(await screen.findByLabelText(copy.auth.email), { target: { value: email } })
  fireEvent.click(screen.getByRole('button', { name: copy.passwordReset.request.submit }))
}

it('confirms a reset request in the same words for any email', async () => {
  const requestedEmails: string[] = []
  renderAppAt(
    '/forgot-password',
    stubApiClient({
      forgotPassword: async (email) => {
        requestedEmails.push(email)
        return undefined
      },
    }),
  )

  await askForReset('nadie@example.com')

  expect((await screen.findByRole('status')).textContent).toBe(
    'Si ese correo tiene un feudo y está confirmado, te llegará un enlace que vale una hora.',
  )
  expect(screen.queryByLabelText(copy.auth.email)).toBeNull()
  expect(requestedEmails).toEqual(['nadie@example.com'])
})

it('refuses a malformed email without a request', async () => {
  let requests = 0
  renderAppAt(
    '/forgot-password',
    stubApiClient({
      forgotPassword: async () => {
        requests += 1
        return undefined
      },
    }),
  )

  await askForReset('nombre@ejemplo')

  expect((await screen.findByText(copy.auth.invalidEmail)).textContent).toBe(
    'Escribe un correo válido, como nombre@ejemplo.com.',
  )
  expect(screen.getByLabelText(copy.auth.email).getAttribute('aria-invalid')).toBe('true')
  expect(requests).toBe(0)
})

it('shows the Spanish line of an unexpected answer to a reset request', async () => {
  renderAppAt('/forgot-password', stubApiClient({ forgotPassword: async () => 'Unexpected' }))

  await askForReset('aldonza@example.com')

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.Unexpected)
  expect(screen.getByRole('button', { name: copy.passwordReset.request.submit })).not.toBeNull()
})

it('leads back to sign in from the reset request', async () => {
  renderAppAt('/forgot-password', stubApiClient())

  expect(
    (await screen.findByRole('link', { name: copy.auth.signIn.title })).getAttribute('href'),
  ).toBe('/sign-in')
})
