import { authSignInTitle, shellSignOut } from '@mygame/catalog'
import { fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderAppAt } from './renderAppAt.testSupport'
import { knownPlayer, stubApiClient } from './stubApiClient.testSupport'

it('sends a signed-out visitor to the sign-in screen', async () => {
  renderAppAt('/', stubApiClient({ currentPlayer: async () => undefined }))

  expect(await screen.findByRole('heading', { level: 1, name: authSignInTitle() })).toBeDefined()
})

it('returns a player who signs out to the sign-in screen', async () => {
  let isSignedIn = true
  renderAppAt(
    '/',
    stubApiClient({
      currentPlayer: async () => (isSignedIn ? knownPlayer : undefined),
      signOut: async () => {
        isSignedIn = false
        return { ok: true, value: undefined }
      },
    }),
  )

  fireEvent.click(await screen.findByRole('button', { name: shellSignOut() }))

  expect(await screen.findByRole('heading', { level: 1, name: authSignInTitle() })).toBeDefined()
})
