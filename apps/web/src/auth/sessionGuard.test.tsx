import { fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { copy } from '../copy'
import { renderAppAt } from './renderAppAt'
import { knownPlayer, stubApiClient } from './stubApiClient'

it('sends a signed-out visitor to the sign-in screen', async () => {
  renderAppAt('/', stubApiClient({ currentPlayer: async () => undefined }))

  expect(
    await screen.findByRole('heading', { level: 1, name: copy.auth.signIn.title }),
  ).toBeDefined()
})

it('keeps a signed-in visitor away from the sign-in screen', async () => {
  renderAppAt('/sign-in', stubApiClient({ currentPlayer: async () => knownPlayer }))

  expect(await screen.findByText(copy.shell.welcome)).toBeDefined()
  expect(screen.queryByRole('heading', { name: copy.auth.signIn.title })).toBeNull()
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

  fireEvent.click(await screen.findByRole('button', { name: copy.shell.signOut }))

  expect(
    await screen.findByRole('heading', { level: 1, name: copy.auth.signIn.title }),
  ).toBeDefined()
})
