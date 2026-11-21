import { es } from '@mygame/catalog'
import { screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { renderAppAt } from './renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from './stubApiClient.testSupport'

beforeEach(() => {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-ES')
})

it('keeps a signed-in visitor away from the sign-in screen', async () => {
  renderAppAt('/sign-in', stubApiClient({ currentPlayer: async () => knownPlayer }))

  expect(
    await screen.findByRole('heading', { level: 1, name: new RegExp(knownTown.name) }),
  ).toBeDefined()
  expect(screen.queryByRole('heading', { name: es.authSignInTitle() })).toBeNull()
})
