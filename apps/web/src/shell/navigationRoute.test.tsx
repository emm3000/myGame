import { fireEvent, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownFiefPath, knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

const signedInClient = stubApiClient({ currentPlayer: async () => knownPlayer })

const screensNavigation = async (): Promise<HTMLElement> =>
  screen.findByRole('navigation', { name: (accessibleName) => accessibleName === '' })

const navigationLink = async (name: string): Promise<HTMLElement> =>
  within(await screensNavigation()).getByRole('link', { name })

it('marks the current screen in the navigation', async () => {
  renderAppAt(knownFiefPath, signedInClient)

  const fief = await navigationLink(copy.shell.navigation.fief)
  const map = await navigationLink(copy.shell.navigation.map)
  const chronicle = await navigationLink(copy.shell.navigation.chronicle)

  expect(fief.getAttribute('aria-current')).toBe('page')
  expect(map.getAttribute('aria-current')).toBeNull()
  expect(chronicle.getAttribute('aria-current')).toBeNull()
})

it('lists the fief, the map and the chronicle in the navigation', async () => {
  renderAppAt(knownFiefPath, signedInClient)

  const links = within(await screensNavigation()).getAllByRole('link')

  expect(links.map((link) => link.textContent)).toEqual(['Feudo', 'Mapa', 'Crónica'])
})

const expectMapMarked = async (): Promise<void> => {
  const map = await navigationLink(copy.shell.navigation.map)
  const fief = await navigationLink(copy.shell.navigation.fief)

  expect(map.getAttribute('aria-current')).toBe('page')
  expect(fief.getAttribute('aria-current')).toBeNull()
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

  fireEvent.click(await navigationLink(copy.shell.navigation.chronicle))

  expect(await screen.findByRole('heading', { level: 2, name: copy.chronicle.title })).toBeDefined()
  expect((await navigationLink(copy.shell.navigation.chronicle)).getAttribute('aria-current')).toBe(
    'page',
  )
})

it('keeps the fief id in the navigation', async () => {
  renderAppAt(`${knownFiefPath}/cronica`, signedInClient)

  const links = within(await screensNavigation()).getAllByRole('link')

  expect(links.map((link) => link.getAttribute('href'))).toEqual([
    knownFiefPath,
    `${knownFiefPath}/mapa`,
    `${knownFiefPath}/cronica`,
  ])
})
