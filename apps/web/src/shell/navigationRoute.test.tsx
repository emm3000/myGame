import { fireEvent, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

const signedInClient = stubApiClient({ currentPlayer: async () => knownPlayer })

const navigationLink = async (name: string): Promise<HTMLElement> =>
  within(await screen.findByRole('navigation')).getByRole('link', { name })

it('marks the current screen in the navigation', async () => {
  renderAppAt('/', signedInClient)

  const fief = await navigationLink(copy.shell.navigation.fief)
  const map = await navigationLink(copy.shell.navigation.map)
  const chronicle = await navigationLink(copy.shell.navigation.chronicle)

  expect(fief.getAttribute('aria-current')).toBe('page')
  expect(map.getAttribute('aria-current')).toBeNull()
  expect(chronicle.getAttribute('aria-current')).toBeNull()
})

it('lists the fief, the map and the chronicle in the navigation', async () => {
  renderAppAt('/', signedInClient)

  const links = within(await screen.findByRole('navigation')).getAllByRole('link')

  expect(links.map((link) => link.textContent)).toEqual(['Feudo', 'Mapa', 'Crónica'])
})

it.each(['/mapa', '/mapa/3'])('marks the map in the navigation on %s', async (path) => {
  renderAppAt(path, signedInClient)

  const map = await navigationLink(copy.shell.navigation.map)
  const fief = await navigationLink(copy.shell.navigation.fief)

  expect(map.getAttribute('aria-current')).toBe('page')
  expect(fief.getAttribute('aria-current')).toBeNull()
})

it('opens the chronicle from the fief screen', async () => {
  renderAppAt('/', signedInClient)

  fireEvent.click(await navigationLink(copy.shell.navigation.chronicle))

  expect(await screen.findByRole('heading', { level: 2, name: copy.chronicle.title })).toBeDefined()
  expect((await navigationLink(copy.shell.navigation.chronicle)).getAttribute('aria-current')).toBe(
    'page',
  )
})
