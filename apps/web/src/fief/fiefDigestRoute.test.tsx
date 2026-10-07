import type { Digest, FiefList } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiRefusal } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefList,
  knownFiefPath,
  knownPlayer,
  quietDigest,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownFief.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const secondFiefId = '4f1e2d3c-6b5a-4978-8a1b-2c3d4e5f6a7b'

const dueDigest: Digest = {
  acknowledgedAt: '2026-09-21T11:00:00.000Z',
  isDue: true,
  fiefs: [
    {
      id: secondFiefId,
      name: 'Sotoverde del Páramo',
      events: [
        {
          kind: 'recruitsDelivered',
          unit: 'infantry',
          count: 12,
          occurredAt: '2026-09-21T20:30:00.000Z',
        },
      ],
      stores: [],
    },
    {
      id: knownFief.id,
      name: knownFief.name,
      events: [
        {
          kind: 'upgradeFinished',
          building: 'sawmill',
          level: 3,
          occurredAt: '2026-09-21T18:10:00.000Z',
        },
      ],
      stores: [{ resource: 'stone', fullSince: '2026-09-21T17:00:00.000Z' }],
    },
  ],
}

const showFief = async (overrides: Partial<ApiClient>, path = knownFiefPath): Promise<void> => {
  renderAppAt(path, stubApiClient({ currentPlayer: async () => knownPlayer, ...overrides }))
  await passSeconds(0)
}

const digestCard = (): HTMLElement => screen.getByRole('article', { name: copy.digest.title })

const acknowledgeButton = (): HTMLElement =>
  within(digestCard()).getByRole('button', { name: copy.digest.acknowledge })

it('shows the digest card when the digest is due', async () => {
  await showFief({ digest: async () => ({ ok: true, value: dueDigest }) })

  expect(digestCard()).toBeDefined()
})

it('shows no digest card when it is not due', async () => {
  await showFief({ digest: async () => ({ ok: true, value: quietDigest }) })

  expect(screen.queryByRole('article', { name: copy.digest.title })).toBeNull()
  expect(screen.queryByText(copy.digest.title)).toBeNull()
})

it('names each fief and its full stores in the digest', async () => {
  await showFief({ digest: async () => ({ ok: true, value: dueDigest }) })

  const fiefHeadings = within(digestCard()).getAllByRole('heading', { level: 4 })
  expect(fiefHeadings.map((heading) => heading.textContent)).toEqual([
    'Sotoverde del Páramo',
    knownFief.name,
  ])
  const knownFiefRows = within(
    within(digestCard()).getByRole('list', { name: knownFief.name }),
  ).getAllByRole('listitem')
  expect(knownFiefRows.map((row) => row.textContent)).toEqual([
    '21 sept, 20:10Obra terminada: aserradero, nivel 3.',
    '21 sept, 19:00Almacén lleno: piedra.',
  ])
  expect(within(digestCard()).getByText('Leva terminada:')).toBeDefined()
})

it('leaves a fief with no news out of the digest', async () => {
  const quietFief = { id: secondFiefId, name: 'Sotoverde del Páramo', events: [], stores: [] }
  const withQuietFief: Digest = { ...dueDigest, fiefs: [quietFief, ...dueDigest.fiefs.slice(1)] }
  await showFief({ digest: async () => ({ ok: true, value: withQuietFief }) })

  const fiefHeadings = within(digestCard()).getAllByRole('heading', { level: 4 })
  expect(fiefHeadings.map((heading) => heading.textContent)).toEqual([knownFief.name])
})

it('reads an event with its amounts as the chronicle does', async () => {
  const withLoot: Digest = {
    ...dueDigest,
    fiefs: [
      {
        id: knownFief.id,
        name: knownFief.name,
        events: [
          {
            kind: 'marchReturned',
            province: 2,
            plot: 7,
            units: { infantry: 12, cavalry: 0, archer: 0, settler: 0 },
            loot: { wood: 120, stone: 0, iron: 0, gold: 30, food: 0 },
            occurredAt: '2026-09-21T18:10:00.000Z',
            recalled: false,
          },
        ],
        stores: [],
      },
    ],
  }
  await showFief({ digest: async () => ({ ok: true, value: withLoot }) })

  expect(within(digestCard()).getByText('Recibes 120 de madera y 30 de oro.')).toBeDefined()
  expect(within(digestCard()).getByText('Recibes')).toBeDefined()
  expect(within(digestCard()).getByText('120')).toBeDefined()
})

it('reads the digest once per visit, never on a timer', async () => {
  const digest = vi.fn(async () => ({ ok: true as const, value: dueDigest }))
  await showFief({ digest })

  await passSeconds(180)

  expect(digest).toHaveBeenCalledTimes(1)
})

it('hides the digest card after Entendido', async () => {
  const acknowledgeDigest = vi.fn(async () => undefined)
  await showFief({ digest: async () => ({ ok: true, value: dueDigest }), acknowledgeDigest })

  fireEvent.click(acknowledgeButton())
  await passSeconds(0)

  expect(acknowledgeDigest).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('article', { name: copy.digest.title })).toBeNull()
})

it('keeps the digest card when Entendido is refused', async () => {
  const refused: ApiRefusal = 'Unexpected'
  await showFief({
    digest: async () => ({ ok: true, value: dueDigest }),
    acknowledgeDigest: async () => refused,
  })

  fireEvent.click(acknowledgeButton())
  await passSeconds(0)

  expect(digestCard()).toBeDefined()
  expect(within(digestCard()).getByRole('alert').textContent).toBe(copy.refusals.Unexpected)
})

it('sends Entendido once on a double click', async () => {
  const acknowledgeDigest = vi.fn(async () => undefined)
  await showFief({ digest: async () => ({ ok: true, value: dueDigest }), acknowledgeDigest })

  const button = acknowledgeButton()
  await act(async () => {
    fireEvent.click(button)
    fireEvent.click(button)
  })

  expect(acknowledgeDigest).toHaveBeenCalledTimes(1)
})

it('never shows an acknowledged digest again on the other fief', async () => {
  let isAcknowledged = false
  const bothFiefs: FiefList = {
    fiefs: [
      {
        id: secondFiefId,
        name: 'Sotoverde del Páramo',
        coordinates: { kingdom: 1, province: 2, plot: 7 },
        freeSlots: [],
        fullStores: [],
      },
      ...knownFiefList.fiefs,
    ],
  }
  await showFief({
    fiefs: async () => ({ ok: true, value: bothFiefs }),
    digest: async () => ({ ok: true, value: isAcknowledged ? quietDigest : dueDigest }),
    acknowledgeDigest: async () => {
      isAcknowledged = true
      return undefined
    },
  })

  fireEvent.click(acknowledgeButton())
  await passSeconds(0)
  const switcher = screen.getByRole('navigation', { name: copy.shell.fiefSwitcher.label })
  fireEvent.click(within(switcher).getByRole('link', { name: /Sotoverde del Páramo/ }))
  await passSeconds(0)

  expect(screen.queryByRole('article', { name: copy.digest.title })).toBeNull()
})

const press = async (button: HTMLElement): Promise<void> => {
  button.focus()
  fireEvent.click(button)
  await passSeconds(0)
}

it('moves focus to the fief name when the digest is acknowledged', async () => {
  await showFief({
    digest: async () => ({ ok: true, value: dueDigest }),
    acknowledgeDigest: async () => undefined,
  })

  await press(acknowledgeButton())

  expect(document.activeElement).toBe(
    screen.getByRole('heading', { level: 2, name: knownFief.name }),
  )
})

it('keeps focus on Entendido when the acknowledgement is refused', async () => {
  await showFief({
    digest: async () => ({ ok: true, value: dueDigest }),
    acknowledgeDigest: async () => 'Unexpected',
  })
  const button = acknowledgeButton()

  await press(button)

  expect(document.activeElement).toBe(button)
})
