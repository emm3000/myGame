import type { SignUpRequest } from '@mygame/contracts'
import { fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { copy } from '../copy'
import { renderAppAt } from './renderAppAt.testSupport'
import { knownPlayer, stubApiClient } from './stubApiClient.testSupport'

const fillSignUp = async (request: SignUpRequest): Promise<void> => {
  fireEvent.change(await screen.findByLabelText(copy.auth.email), {
    target: { value: request.email },
  })
  fireEvent.change(screen.getByLabelText(copy.auth.password), {
    target: { value: request.password },
  })
  fireEvent.change(screen.getByLabelText(copy.auth.signUp.fiefName), {
    target: { value: request.fiefName },
  })
  fireEvent.click(screen.getByRole('button', { name: copy.auth.signUp.submit }))
}

const newcomer: SignUpRequest = {
  email: 'aldonza@example.com',
  password: 'piedra-y-lodo',
  fiefName: 'Vado Gris',
}

it('shows the Spanish message for a taken email', async () => {
  renderAppAt(
    '/sign-up',
    stubApiClient({ signUp: async () => ({ ok: false, refusal: 'EmailTaken' }) }),
  )

  await fillSignUp(newcomer)

  expect(await screen.findByText(copy.refusals.EmailTaken)).toBeDefined()
  expect(screen.getByLabelText(copy.auth.email).getAttribute('aria-invalid')).toBe('true')
})

it('refuses to submit a password shorter than eight characters', async () => {
  const sentRequests: SignUpRequest[] = []
  renderAppAt(
    '/sign-up',
    stubApiClient({
      signUp: async (request) => {
        sentRequests.push(request)
        return { ok: true, value: knownPlayer }
      },
    }),
  )

  await fillSignUp({ ...newcomer, password: 'piedra7' })

  expect(await screen.findByText(copy.refusals.WeakPassword)).toBeDefined()
  expect(sentRequests).toEqual([])
})

it('lands a new player on the fief once signed up', async () => {
  let isSignedIn = false
  renderAppAt(
    '/sign-up',
    stubApiClient({
      signUp: async () => {
        isSignedIn = true
        return { ok: true, value: knownPlayer }
      },
      currentPlayer: async () => (isSignedIn ? knownPlayer : undefined),
    }),
  )

  await fillSignUp(newcomer)

  expect(await screen.findByText(copy.shell.welcome)).toBeDefined()
})
