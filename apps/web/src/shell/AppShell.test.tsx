import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownFiefPath, knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'

it('renders the shell title', async () => {
  renderAppAt(knownFiefPath, stubApiClient({ currentPlayer: async () => knownPlayer }))

  expect(await screen.findByRole('heading', { level: 1, name: 'myGame' })).toBeDefined()
})
