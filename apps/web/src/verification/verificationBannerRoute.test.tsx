import {
  passwordResetRequestSubmit,
  verificationBannerSent,
  verificationVerifyTitle,
} from '@mygame/catalog'
import { act, fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'

const unverifiedPlayer = { ...knownPlayer, emailVerified: false }

const unverifiedClientResending = (
  resendVerification: ApiClient['resendVerification'],
): ApiClient => stubApiClient({ currentPlayer: async () => unverifiedPlayer, resendVerification })

const resendButton = (): Promise<HTMLElement> =>
  screen.findByRole('button', { name: passwordResetRequestSubmit() })

it('shows the banner to a player whose email is not verified', async () => {
  renderAppAt(knownFiefPath, stubApiClient({ currentPlayer: async () => unverifiedPlayer }))

  expect(await screen.findByText(verificationVerifyTitle())).toBeDefined()
  expect(await resendButton()).toBeDefined()
})

it('draws the unconfirmed mail as one line at the foot', async () => {
  renderAppAt(knownFiefPath, stubApiClient({ currentPlayer: async () => unverifiedPlayer }))

  const line = await screen.findByRole('region', { name: verificationVerifyTitle() })
  const main = screen.getByRole('main')

  expect(line.textContent).toBe(`${verificationVerifyTitle()}${passwordResetRequestSubmit()}`)
  expect(main.contains(line)).toBe(false)
  expect(main.compareDocumentPosition(line)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
})

it('swaps the line for the confirmation of a resend', async () => {
  renderAppAt(
    knownFiefPath,
    unverifiedClientResending(async () => undefined),
  )

  fireEvent.click(await resendButton())
  await screen.findByRole('status')

  expect(screen.queryByText(verificationVerifyTitle())).toBeNull()
})

it('shows no banner once the email is verified', async () => {
  renderAppAt(knownFiefPath, stubApiClient({ currentPlayer: async () => knownPlayer }))

  await screen.findByRole('heading', { level: 2, name: knownFief.name })

  expect(screen.queryByText(verificationVerifyTitle())).toBeNull()
  expect(screen.queryByRole('button', { name: passwordResetRequestSubmit() })).toBeNull()
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

  expect((await screen.findByRole('status')).textContent).toBe(verificationBannerSent())
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
