import type { FiefOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
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

const instantAfterRead = (seconds: number): string =>
  new Date(Date.parse(knownFief.readAt) + seconds * 1000).toISOString()

const barracksFive: FiefOverview = {
  ...knownFief,
  buildings: {
    ...knownFief.buildings,
    barracks: { ...knownFief.buildings.barracks, level: 5 },
  },
  units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
}

type FoundingMarch = Extract<NonNullable<FiefOverview['march']>, { readonly order: 'found' }>

const foundingDeparted = (secondsBeforeRead: number): FoundingMarch => ({
  order: 'found',
  name: 'Sotoverde del Páramo',
  province: 2,
  plot: 7,
  terrain: 'uplands',
  units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
  stayHours: 0,
  departedAt: instantAfterRead(-secondsBeforeRead),
  oneWaySeconds: 900,
  loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  arrivesAt: instantAfterRead(900 - secondsBeforeRead),
  leavesAt: instantAfterRead(900 - secondsBeforeRead),
  returnsAt: instantAfterRead(1800 - secondsBeforeRead),
  recalledAt: null,
  camp: null,
  fought: false,
})

const foundingUnderway: FiefOverview = { ...barracksFive, march: foundingDeparted(150) }

const foundingRecalled: FiefOverview = {
  ...barracksFive,
  march: {
    ...foundingDeparted(600),
    leavesAt: instantAfterRead(0),
    arrivesAt: instantAfterRead(0),
    returnsAt: instantAfterRead(600),
    recalledAt: instantAfterRead(0),
  },
}

const answeredNow = (overview: FiefOverview): FiefOverview => ({
  ...overview,
  readAt: new Date(Date.now()).toISOString(),
})

const showFief = async (overrides: Partial<ApiClient>): Promise<void> => {
  renderAppAt(
    knownFiefPath,
    stubApiClient({ currentPlayer: async () => knownPlayer, ...overrides }),
  )
  await passSeconds(0)
}

const armySection = (): HTMLElement => screen.getByRole('region', { name: copy.army.section })

const line = (text: string): HTMLElement | null =>
  within(armySection()).queryByText(
    (_, element) =>
      element?.textContent === text &&
      Array.from(element.children).every((child) => child.textContent !== text),
  )

const countdown = (): HTMLElement => within(armySection()).getByRole('timer')

const recallButton = (): HTMLElement | null =>
  within(armySection()).queryByRole('button', { name: 'Retirar la marcha: 1 colono' })

it('shows the founding march outbound with its recall', async () => {
  const recallMarch = vi.fn(
    async () => ({ ok: true, value: answeredNow(foundingRecalled) }) as const,
  )
  await showFief({
    fief: async () => ({ ok: true, value: answeredNow(foundingUnderway) }),
    recallMarch,
  })

  expect(line('Marcha de fundación: 1 colono a provincia 2, parcela 7')).not.toBeNull()
  expect(line('Nuevo feudo: Sotoverde del Páramo')).not.toBeNull()
  expect(within(countdown()).getByText('Llegada en')).toBeDefined()
  expect(within(countdown()).getByText('12 min')).toBeDefined()
  expect(within(armySection()).queryByText(/Botín/)).toBeNull()

  fireEvent.click(recallButton() as HTMLElement)
  await passSeconds(0)

  expect(recallMarch).toHaveBeenCalledWith(knownFief.id, {
    departedAt: foundingUnderway.march?.departedAt,
  })
})

it('shows a recalled founding returning with its settler', async () => {
  await showFief({ fief: async () => ({ ok: true, value: answeredNow(foundingRecalled) }) })

  expect(line('Marcha de vuelta: 1 colono desde provincia 2, parcela 7')).not.toBeNull()
  expect(within(countdown()).getByText('Vuelta en')).toBeDefined()
  expect(within(countdown()).getByText('10 min')).toBeDefined()
  expect(within(armySection()).queryByText(/Nuevo feudo/)).toBeNull()
  expect(within(armySection()).queryByText(/Botín/)).toBeNull()
  expect(recallButton()).toBeNull()
})

it('reads the founded fief at the arrival', async () => {
  const founded: FiefOverview = {
    ...barracksFive,
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
  }
  const fief = vi
    .fn<ApiClient['fief']>()
    .mockImplementationOnce(async () => ({
      ok: true,
      value: answeredNow({ ...barracksFive, march: foundingDeparted(860) }),
    }))
    .mockImplementation(async () => ({ ok: true, value: answeredNow(founded) }))
  await showFief({ fief })

  await passSeconds(40)

  expect(line(copy.march.idleSlot)).not.toBeNull()
})
