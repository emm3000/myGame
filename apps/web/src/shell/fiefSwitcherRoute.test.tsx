import type { FiefList } from '@mygame/contracts'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefList,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

const secondFiefId = '4f1e2d3c-6b5a-4978-8a1b-2c3d4e5f6a7b'
const secondFiefPath = `/feudo/${secondFiefId}`

const bothFiefs: FiefList = {
  fiefs: [
    {
      id: secondFiefId,
      name: 'Sotoverde del Páramo',
      coordinates: { kingdom: 1, province: 2, plot: 7 },
    },
    { id: knownFief.id, name: knownFief.name, coordinates: knownFief.coordinates },
  ],
}

const signedInClient = (fiefs: ApiClient['fiefs']): ApiClient =>
  stubApiClient({ currentPlayer: async () => knownPlayer, fiefs })

const lordOfBothFiefs = signedInClient(async () => ({ ok: true, value: bothFiefs }))

const secondEntryName = 'Sotoverde del Páramo, Vadoalto 2:7'
const knownEntryName = 'Fuenteclara, Vadoalto 3:12'

const switcher = async (): Promise<HTMLElement> =>
  screen.findByRole('navigation', { name: copy.shell.fiefSwitcher.label })

const switcherEntry = async (name: string): Promise<HTMLElement> =>
  within(await switcher()).getByRole('link', { name })

it('lists both fiefs of the lord', async () => {
  renderAppAt(knownFiefPath, lordOfBothFiefs)

  const entries = within(await switcher()).getAllByRole('link')

  expect(entries).toEqual([
    await switcherEntry(secondEntryName),
    await switcherEntry(knownEntryName),
  ])
  expect(within(await switcher()).getByText(copy.shell.fiefSwitcher.label)).toBeDefined()
})

it('marks the current fief', async () => {
  renderAppAt(knownFiefPath, lordOfBothFiefs)

  expect((await switcherEntry(knownEntryName)).getAttribute('aria-current')).toBe('page')
  expect((await switcherEntry(secondEntryName)).getAttribute('aria-current')).toBeNull()
})

type ReadFiefIds = {
  readonly client: ApiClient
  readonly fiefIds: Array<string>
}

const recordingLordOfBothFiefs = (read: 'fief' | 'provinceMap' | 'chronicle'): ReadFiefIds => {
  const fiefIds: Array<string> = []
  const stub = stubApiClient()
  const recorded: Partial<ApiClient> = {
    fief: async (fiefId) => {
      fiefIds.push(fiefId)
      return stub.fief(fiefId)
    },
    provinceMap: async (fiefId, province) => {
      fiefIds.push(fiefId)
      return stub.provinceMap(fiefId, province)
    },
    chronicle: async (fiefId) => {
      fiefIds.push(fiefId)
      return stub.chronicle(fiefId)
    },
  }
  const client = stubApiClient({
    currentPlayer: async () => knownPlayer,
    fiefs: async () => ({ ok: true, value: bothFiefs }),
    [read]: recorded[read],
  })
  return { client, fiefIds }
}

const chooseSecondFief = async (): Promise<void> => {
  fireEvent.click(await switcherEntry(secondEntryName))
  await waitFor(async () =>
    expect((await switcherEntry(secondEntryName)).getAttribute('aria-current')).toBe('page'),
  )
}

it('opens the other fief on the fief screen', async () => {
  const { client, fiefIds } = recordingLordOfBothFiefs('fief')
  renderAppAt(knownFiefPath, client)

  expect((await switcherEntry(secondEntryName)).getAttribute('href')).toBe(secondFiefPath)
  await chooseSecondFief()

  await waitFor(() => expect(fiefIds.at(-1)).toBe(secondFiefId))
  expect((await switcherEntry(knownEntryName)).getAttribute('href')).toBe(knownFiefPath)
})

it('opens the province of the other fief on the map', async () => {
  const { client, fiefIds } = recordingLordOfBothFiefs('provinceMap')
  renderAppAt(`${knownFiefPath}/mapa/4`, client)

  expect((await switcherEntry(secondEntryName)).getAttribute('href')).toBe(`${secondFiefPath}/mapa`)
  await chooseSecondFief()

  await waitFor(() => expect(fiefIds.at(-1)).toBe(secondFiefId))
  expect((await switcherEntry(knownEntryName)).getAttribute('href')).toBe(`${knownFiefPath}/mapa`)
})

it('opens the chronicle of the other fief', async () => {
  const { client, fiefIds } = recordingLordOfBothFiefs('chronicle')
  renderAppAt(`${knownFiefPath}/cronica`, client)

  expect((await switcherEntry(secondEntryName)).getAttribute('href')).toBe(
    `${secondFiefPath}/cronica`,
  )
  await chooseSecondFief()

  await waitFor(() => expect(fiefIds.at(-1)).toBe(secondFiefId))
  expect(await screen.findByRole('heading', { level: 2, name: copy.chronicle.title })).toBeDefined()
})

it('reads one fief as the design draws it', async () => {
  renderAppAt(
    knownFiefPath,
    signedInClient(async () => ({ ok: true, value: knownFiefList })),
  )

  const entries = within(await switcher()).getAllByRole('link')

  expect(entries).toEqual([await switcherEntry(knownEntryName)])
  expect(entries[0]?.getAttribute('aria-current')).toBe('page')
  expect(within(await switcher()).getByText(copy.shell.fiefSwitcher.label)).toBeDefined()
})

it('keeps the navigation when the list fails', async () => {
  renderAppAt(
    knownFiefPath,
    signedInClient(async () => ({ ok: false, refusal: 'Unexpected' })),
  )

  const screens = await screen.findByRole('navigation')

  expect(
    within(screens)
      .getAllByRole('link')
      .map((link) => link.textContent),
  ).toEqual(['Feudo', 'Mapa', 'Crónica'])
  expect(screen.queryByRole('navigation', { name: copy.shell.fiefSwitcher.label })).toBeNull()
})

it('reads the list again on each navigation', async () => {
  const reads: Array<string> = []
  renderAppAt(
    knownFiefPath,
    signedInClient(async () => {
      reads.push('fiefs')
      return { ok: true, value: bothFiefs }
    }),
  )
  await switcher()
  expect(reads).toHaveLength(1)

  fireEvent.click(
    within(await screen.findByRole('navigation', { name: (name) => name === '' })).getByRole(
      'link',
      { name: copy.shell.navigation.chronicle },
    ),
  )

  await waitFor(() => expect(reads).toHaveLength(2))
})
