import {
  chronicleTitle,
  shellNavigationChronicle,
  shellNavigationFief,
  shellNavigationMap,
  shellNavigationTown,
} from '@mygame/catalog'
import { fireEvent, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  knownTown,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'

const signedInClient = stubApiClient({ currentPlayer: async () => knownPlayer })

const screensNavigation = async (): Promise<HTMLElement> =>
  screen.findByRole('navigation', { name: (accessibleName) => accessibleName === '' })

const navigationLink = async (name: string): Promise<HTMLElement> =>
  within(await screensNavigation()).getByRole('link', { name })

it('marks the town as the current screen at the root', async () => {
  renderAppAt('/', signedInClient)

  const town = await navigationLink(shellNavigationTown())

  expect(town.getAttribute('aria-current')).toBe('page')
})

it('drops Feudo from the navigation', async () => {
  renderAppAt(knownFiefPath, signedInClient)

  const links = within(await screensNavigation()).getAllByRole('link')

  expect(links.map((link) => link.textContent)).toEqual([
    shellNavigationTown(),
    shellNavigationMap(),
    shellNavigationChronicle(),
  ])
  expect(links.map((link) => link.textContent)).not.toContain(shellNavigationFief())
})

it('keeps /feudo/$fiefId reachable', async () => {
  renderAppAt(knownFiefPath, signedInClient)

  expect(await screen.findByRole('heading', { level: 2, name: knownFief.name })).toBeDefined()
})

it('opens the town from a fief screen', async () => {
  renderAppAt(knownFiefPath, signedInClient)

  fireEvent.click(await navigationLink(shellNavigationTown()))

  expect(await screen.findByRole('heading', { level: 2, name: knownTown.name })).toBeDefined()
})

const expectMapMarked = async (): Promise<void> => {
  const map = await navigationLink(shellNavigationMap())
  const town = await navigationLink(shellNavigationTown())

  expect(map.getAttribute('aria-current')).toBe('page')
  expect(town.getAttribute('aria-current')).toBeNull()
}

it('marks the map in the navigation on the province of the fief', async () => {
  renderAppAt(`${knownFiefPath}/mapa`, signedInClient)

  await expectMapMarked()
})

it('marks the map in the navigation on a numbered province', async () => {
  renderAppAt(`${knownFiefPath}/mapa/3`, signedInClient)

  await expectMapMarked()
})

it('opens the chronicle from the fief screen', async () => {
  renderAppAt(knownFiefPath, signedInClient)

  fireEvent.click(await navigationLink(shellNavigationChronicle()))

  expect(await screen.findByRole('heading', { level: 2, name: chronicleTitle() })).toBeDefined()
  expect((await navigationLink(shellNavigationChronicle())).getAttribute('aria-current')).toBe(
    'page',
  )
})

it('keeps the fief id in the navigation', async () => {
  renderAppAt(`${knownFiefPath}/cronica`, signedInClient)

  const links = within(await screensNavigation()).getAllByRole('link')

  expect(links.map((link) => link.getAttribute('href'))).toEqual([
    '/',
    `${knownFiefPath}/mapa`,
    `${knownFiefPath}/cronica`,
  ])
})
