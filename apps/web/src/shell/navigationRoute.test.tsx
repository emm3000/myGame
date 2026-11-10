import {
  reportReviewsDue,
  reportTitle,
  shellNavigationReport,
  shellNavigationTown,
  shellSignOut,
  shellTitle,
  townGoToSchool,
  townLabelCity,
  townLabelTown,
} from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { assert, expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { placeNameOf } from '../town/placeNameOf'

const signedInClient = stubApiClient({ currentPlayer: async () => knownPlayer })

const servingTown = (town: TownOverview): ApiClient =>
  stubApiClient({
    currentPlayer: async () => knownPlayer,
    town: async () => ({ ok: true, value: town }),
  })

const noTownClient = stubApiClient({
  currentPlayer: async () => knownPlayer,
  town: async () => ({ ok: false, refusal: 'TownNotFound', error: undefined }),
})

const townDue = (count: number): TownOverview => ({
  ...knownTown,
  nextStep: { kind: 'reviews', count, readFirst: [] },
})

const townHeading = (): Promise<HTMLElement> =>
  screen.findByRole('heading', { level: 1, name: new RegExp(knownTown.name) })

const schoolDoor = async (): Promise<HTMLElement> =>
  within(await screen.findByRole('main')).findByRole('link', { name: placeNameOf('school') })

const reportDoor = async (name: string): Promise<HTMLElement> =>
  within(await screen.findByRole('main')).findByRole('link', { name })

const shellHeader = async (): Promise<HTMLElement> => {
  const [header] = await screen.findAllByRole('banner')
  assert(header !== undefined)
  return header
}

const backLink = async (): Promise<HTMLElement> =>
  within(await shellHeader()).findByRole('link', { name: shellNavigationTown() })

it('draws no navigation bar', async () => {
  renderAppAt('/', signedInClient)
  await townHeading()

  expect(screen.queryByRole('navigation')).toBeNull()
})

it('opens the school and the Report from the two doors', async () => {
  const router = renderAppAt('/', signedInClient)

  fireEvent.click(await schoolDoor())
  expect(
    await screen.findByRole('heading', { level: 1, name: placeNameOf('school') }),
  ).toBeDefined()

  await act(() => router.navigate({ to: '/' }))
  fireEvent.click(await reportDoor(shellNavigationReport()))
  expect(await screen.findByRole('heading', { level: 1, name: reportTitle() })).toBeDefined()
})

it('shows the due count on the Report door', async () => {
  renderAppAt('/', servingTown(townDue(5)))

  const door = await reportDoor(`${shellNavigationReport()} ${reportReviewsDue({ count: '5' })}`)

  expect(door.getAttribute('href')).toBe('/report')
})

it('shows a due count of 1 on the Report door', async () => {
  renderAppAt('/', servingTown(townDue(1)))

  expect(
    await reportDoor(`${shellNavigationReport()} ${reportReviewsDue({ count: '1' })}`),
  ).toBeDefined()
})

it('shows no count with nothing due', async () => {
  renderAppAt('/', servingTown(knownTown))

  expect((await reportDoor(shellNavigationReport())).textContent).toBe(shellNavigationReport())
})

it('shows no door to a player with no town', async () => {
  renderAppAt('/', noTownClient)

  await screen.findByRole('textbox')

  expect(screen.queryByRole('link', { name: placeNameOf('school') })).toBeNull()
  expect(screen.queryByRole('link', { name: shellNavigationReport() })).toBeNull()
})

it('holds the name and the label of the town in the header of the town home', async () => {
  renderAppAt('/', signedInClient)

  const heading = await townHeading()

  expect((await shellHeader()).contains(heading)).toBe(true)
  expect(heading.textContent).toBe(`${knownTown.name} · ${townLabelTown()}`)
})

it('names a city as a city in the header', async () => {
  renderAppAt('/', servingTown({ ...knownTown, label: 'city' }))

  expect((await townHeading()).textContent).toBe(`${knownTown.name} · ${townLabelCity()}`)
})

it('writes the name of the town once on the town home', async () => {
  renderAppAt('/', signedInClient)
  await townHeading()

  expect(within(screen.getByRole('main')).queryByText(knownTown.name)).toBeNull()
})

it('links back to the town from every screen but the town home', async () => {
  const router = renderAppAt('/report', signedInClient)

  const screens = ['/report', '/reviews', '/school', '/school/lesson-1']
  for (const path of screens) {
    await act(() => router.navigate({ href: path }))
    expect((await backLink()).getAttribute('href'), path).toBe('/')
  }

  await act(() => router.navigate({ href: '/' }))
  await townHeading()
  expect(within(await shellHeader()).queryByRole('link')).toBeNull()
})

it('holds the town in the back link for a player with no town', async () => {
  renderAppAt('/report', noTownClient)

  expect((await backLink()).getAttribute('href')).toBe('/')
})

it('gives the back link, a text link and a text button control height', async () => {
  const router = renderAppAt('/report', signedInClient)
  const back = await backLink()
  const signOut = await screen.findByRole('button', { name: shellSignOut() })

  await act(() => router.navigate({ to: '/' }))
  const textLink = await screen.findByRole('link', { name: townGoToSchool() })

  const heights = [back, signOut, textLink].map((control) =>
    control.className.split(' ').includes('min-h-control'),
  )
  expect(heights).toEqual([true, true, true])
})

it('keeps room on the page for the sticky foot under a focused control', async () => {
  renderAppAt('/', signedInClient)
  await townHeading()

  expect(document.querySelector('html')?.className).toContain('scroll-pb-12')
})

it("keeps Townword off the signed-in header and in the browser's title", async () => {
  const router = renderAppAt('/', signedInClient)
  await townHeading()
  expect(within(await shellHeader()).queryByText(shellTitle())).toBeNull()

  await act(() => router.navigate({ to: '/report' }))

  expect(within(await shellHeader()).queryByText(shellTitle())).toBeNull()
  expect(document.title).toBe(shellTitle())
})
