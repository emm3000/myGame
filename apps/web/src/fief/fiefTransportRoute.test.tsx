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

const barracksThree: FiefOverview = {
  ...knownFief,
  buildings: {
    ...knownFief.buildings,
    barracks: { ...knownFief.buildings.barracks, level: 3 },
  },
  units: { infantry: 12, cavalry: 6, settler: 0 },
}

type TransportMarch = Extract<NonNullable<FiefOverview['march']>, { readonly order: 'transport' }>

const transportDeparted = (secondsBeforeRead: number): TransportMarch => ({
  order: 'transport',
  toFiefId: '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a',
  cargo: { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 },
  province: 2,
  plot: 7,
  terrain: 'uplands',
  units: { infantry: 0, cavalry: 6, settler: 0 },
  stayHours: 0,
  departedAt: instantAfterRead(-secondsBeforeRead),
  oneWaySeconds: 450,
  loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  arrivesAt: instantAfterRead(450 - secondsBeforeRead),
  leavesAt: instantAfterRead(450 - secondsBeforeRead),
  returnsAt: instantAfterRead(900 - secondsBeforeRead),
  recalledAt: null,
  camp: null,
  fought: false,
})

const transportRecalled: FiefOverview = {
  ...barracksThree,
  march: {
    ...transportDeparted(300),
    arrivesAt: instantAfterRead(0),
    leavesAt: instantAfterRead(0),
    returnsAt: instantAfterRead(300),
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
  within(armySection()).queryByRole('button', { name: 'Retirar la marcha: 6 jinetes' })

const cargoLine = 'Carga: 300 de madera, 200 de piedra y 220 de hierro'

it('shows the transport outbound with its cargo and recall', async () => {
  const recallMarch = vi.fn(
    async () => ({ ok: true, value: answeredNow(transportRecalled) }) as const,
  )
  await showFief({
    fief: async () => ({
      ok: true,
      value: answeredNow({ ...barracksThree, march: transportDeparted(150) }),
    }),
    recallMarch,
  })

  expect(line('Marcha de transporte: 6 jinetes a provincia 2, parcela 7')).not.toBeNull()
  expect(line(cargoLine)).not.toBeNull()
  expect(within(countdown()).getByText('Llegada en')).toBeDefined()
  expect(within(countdown()).getByText('5:00')).toBeDefined()
  expect(within(armySection()).queryByText(/Botín/)).toBeNull()

  fireEvent.click(recallButton() as HTMLElement)
  await passSeconds(0)

  expect(recallMarch).toHaveBeenCalledWith(knownFief.id, {
    departedAt: transportDeparted(150).departedAt,
  })
})

it('turns the transport home empty at the arrival', async () => {
  await showFief({
    fief: async () => ({
      ok: true,
      value: answeredNow({ ...barracksThree, march: transportDeparted(410) }),
    }),
  })
  expect(line(cargoLine)).not.toBeNull()
  expect(within(countdown()).getByText('0:40')).toBeDefined()

  await passSeconds(40)

  expect(line('Vuelta del transporte: 6 jinetes desde provincia 2, parcela 7')).not.toBeNull()
  expect(line(cargoLine)).toBeNull()
  expect(within(countdown()).getByText('Vuelta en')).toBeDefined()
  expect(within(countdown()).getByText('7:30')).toBeDefined()
  expect(recallButton()).toBeNull()
})

it('shows a recalled transport returning with its cargo', async () => {
  await showFief({ fief: async () => ({ ok: true, value: answeredNow(transportRecalled) }) })

  expect(line('Vuelta del transporte: 6 jinetes desde provincia 2, parcela 7')).not.toBeNull()
  expect(line(cargoLine)).not.toBeNull()
  expect(within(countdown()).getByText('Vuelta en')).toBeDefined()
  expect(within(countdown()).getByText('5:00')).toBeDefined()
  expect(recallButton()).toBeNull()
})
