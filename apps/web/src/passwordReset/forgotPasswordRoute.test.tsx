import {
  authEmail,
  authSignInTitle,
  passwordResetRequestSubmit,
  refusalMalformedEmail,
  refusalUnexpected,
} from '@mygame/catalog'
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { stubApiClient } from '../auth/stubApiClient.testSupport'

const askForReset = async (email: string): Promise<void> => {
  fireEvent.change(await screen.findByLabelText(authEmail()), { target: { value: email } })
  fireEvent.click(screen.getByRole('button', { name: passwordResetRequestSubmit() }))
}

const confirmationFor = async (email: string, requestedEmails: string[]): Promise<string> => {
  renderAppAt(
    '/forgot-password',
    stubApiClient({
      forgotPassword: async (requested) => {
        requestedEmails.push(requested)
        return undefined
      },
    }),
  )
  await askForReset(email)
  const confirmation = (await screen.findByRole('status')).textContent ?? ''
  expect(screen.queryByLabelText(authEmail())).toBeNull()
  cleanup()
  return confirmation
}

it('confirms a reset request in the same words for any email', async () => {
  const requestedEmails: string[] = []

  const knownEmailConfirmation = await confirmationFor('aldonza@example.com', requestedEmails)
  const unknownEmailConfirmation = await confirmationFor('nadie@example.com', requestedEmails)

  expect(knownEmailConfirmation).toBe(
    'Si ese correo tiene una cuenta y está confirmado, te llegará un enlace que vale una hora.',
  )
  expect(unknownEmailConfirmation).toBe(knownEmailConfirmation)
  expect(requestedEmails).toEqual(['aldonza@example.com', 'nadie@example.com'])
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

  expect((await screen.findByText(refusalMalformedEmail())).textContent).toBe(
    'Escribe un correo válido, como nombre@ejemplo.com.',
  )
  expect(screen.getByLabelText(authEmail()).getAttribute('aria-invalid')).toBe('true')
  expect(requests).toBe(0)
})

it('shows the Spanish line of an unexpected answer to a reset request', async () => {
  renderAppAt('/forgot-password', stubApiClient({ forgotPassword: async () => 'Unexpected' }))

  await askForReset('aldonza@example.com')

  expect((await screen.findByRole('alert')).textContent).toBe(refusalUnexpected())
  expect(screen.getByRole('button', { name: passwordResetRequestSubmit() })).not.toBeNull()
})

it('leads back to sign in from the reset request', async () => {
  renderAppAt('/forgot-password', stubApiClient())

  expect((await screen.findByRole('link', { name: authSignInTitle() })).getAttribute('href')).toBe(
    '/sign-in',
  )
})

it('moves focus to the confirmation once the request is sent', async () => {
  renderAppAt('/forgot-password', stubApiClient())

  await askForReset('aldonza@example.com')

  const confirmation = await screen.findByRole('status')
  await waitFor(() => expect(document.activeElement).toBe(confirmation))
  expect(confirmation.getAttribute('tabindex')).toBe('-1')
})
