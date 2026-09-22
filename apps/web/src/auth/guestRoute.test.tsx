import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { copy } from '../copy'
import { renderAppAt } from './renderAppAt.testSupport'
import { knownPlayer, stubApiClient } from './stubApiClient.testSupport'

it('keeps a signed-in visitor away from the sign-in screen', async () => {
  renderAppAt('/sign-in', stubApiClient({ currentPlayer: async () => knownPlayer }))

  expect(await screen.findByText(copy.shell.welcome)).toBeDefined()
  expect(screen.queryByRole('heading', { name: copy.auth.signIn.title })).toBeNull()
})
