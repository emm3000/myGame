import { act, fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownFiefPath, knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

const unverifiedPlayer = { ...knownPlayer, emailVerified: false }

const unverifiedClientResending = (
  resendVerification: ApiClient['resendVerification'],
): ApiClient => stubApiClient({ currentPlayer: async () => unverifiedPlayer, resendVerification })

const resendButton = (): Promise<HTMLElement> =>
  screen.findByRole('button', { name: copy.verification.banner.resend })

it('shows the banner to a player whose email is not verified', async () => {
  renderAppAt(knownFiefPath, stubApiClient({ currentPlayer: async () => unverifiedPlayer }))

  expect(await screen.findByText(copy.verification.banner.line)).toBeDefined()
  expect(await resendButton()).toBeDefined()
})

it('shows no banner once the email is verified', async () => {
  renderAppAt(knownFiefPath, stubApiClient({ currentPlayer: async () => knownPlayer }))

  await screen.findByRole('heading', { level: 1, name: copy.shell.title })

  expect(screen.queryByText(copy.verification.banner.line)).toBeNull()
  expect(screen.queryByRole('button', { name: copy.verification.banner.resend })).toBeNull()
})

it('sends one resend per click', async () => {
  let resends = 0
  renderAppAt(
    knownFiefPath,
    unverifiedClientResending(() => {
      resends += 1
      return new Promise<ApiRefusal | undefined>(() => {})
    }),
  )
  const button = await resendButton()

  act(() => {
    button.click()
    button.click()
  })

  expect(resends).toBe(1)
  expect((await resendButton()).hasAttribute('disabled')).toBe(true)
})

it('confirms a resend the api accepted', async () => {
  renderAppAt(
    knownFiefPath,
    unverifiedClientResending(async () => undefined),
  )

  fireEvent.click(await resendButton())

  expect((await screen.findByRole('status')).textContent).toBe(copy.verification.banner.sent)
  expect((await resendButton()).hasAttribute('disabled')).toBe(false)
})

it('shows the Spanish refusal when the new link cannot be sent', async () => {
  renderAppAt(
    knownFiefPath,
    unverifiedClientResending(async () => 'MailNotSent'),
  )

  fireEvent.click(await resendButton())

  expect((await screen.findByRole('alert')).textContent).toBe(
    'No hemos podido enviar el correo. Vuelve a intentarlo en un momento.',
  )
})
