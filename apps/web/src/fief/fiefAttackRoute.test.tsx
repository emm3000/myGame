import type { FiefOverview } from '@mygame/contracts'
import { act, screen, within } from '@testing-library/react'
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

const barracksBuilt: FiefOverview = {
  ...knownFief,
  buildings: {
    ...knownFief.buildings,
    barracks: { ...knownFief.buildings.barracks, level: 1 },
  },
  units: { infantry: 20, cavalry: 0, settler: 0 },
}

type AttackMarch = Extract<NonNullable<FiefOverview['march']>, { readonly order: 'attack' }>

const attackDeparted = (secondsBeforeRead: number): AttackMarch => ({
  order: 'attack',
  province: 2,
  plot: 7,
  terrain: 'uplands',
  units: { infantry: 12, cavalry: 0, settler: 0 },
  stayHours: 0,
  departedAt: instantAfterRead(-secondsBeforeRead),
  oneWaySeconds: 900,
  loot: { wood: 120, stone: 120, iron: 0, gold: 120, food: 0 },
  arrivesAt: instantAfterRead(900 - secondsBeforeRead),
  leavesAt: instantAfterRead(900 - secondsBeforeRead),
  returnsAt: instantAfterRead(1800 - secondsBeforeRead),
  recalledAt: null,
  camp: { tier: 1, strength: 6 },
  fought: false,
})

const attackUnderway: FiefOverview = { ...barracksBuilt, march: attackDeparted(30) }

const attackFightingInFortySeconds: FiefOverview = { ...barracksBuilt, march: attackDeparted(860) }

const attackWon: FiefOverview = {
  ...barracksBuilt,
  units: { infantry: 17, cavalry: 0, settler: 0 },
  march: { ...attackDeparted(860), units: { infantry: 9, cavalry: 0, settler: 0 }, fought: true },
}

const attackLost: FiefOverview = {
  ...barracksBuilt,
  units: { infantry: 8, cavalry: 0, settler: 0 },
  march: null,
}

const forageArrivingInFortySeconds: FiefOverview = {
  ...barracksBuilt,
  march: {
    ...attackDeparted(800),
    order: 'forage',
    stayHours: 2,
    oneWaySeconds: 840,
    loot: { wood: 200, stone: 200, iron: 0, gold: 0, food: 0 },
    arrivesAt: instantAfterRead(40),
    leavesAt: instantAfterRead(7240),
    returnsAt: instantAfterRead(8080),
    camp: null,
    fought: false,
  },
}

const answeredNow = (overview: FiefOverview): FiefOverview => ({
  ...overview,
  readAt: new Date(Date.now()).toISOString(),
})

const answering = (...overviews: ReadonlyArray<FiefOverview>) => {
  const fief = vi.fn<ApiClient['fief']>()
  for (const overview of overviews.slice(0, -1)) {
    fief.mockImplementationOnce(async () => ({ ok: true, value: answeredNow(overview) }))
  }
  const last = overviews[overviews.length - 1] as FiefOverview
  fief.mockImplementation(async () => ({ ok: true, value: answeredNow(last) }))
  return fief
}

const showFief = async (fief: ApiClient['fief']): Promise<void> => {
  renderAppAt(knownFiefPath, stubApiClient({ currentPlayer: async () => knownPlayer, fief }))
  await passSeconds(0)
}

const armySection = (): HTMLElement => screen.getByRole('region', { name: copy.army.section })

const infantryCard = (): HTMLElement =>
  within(armySection()).getByRole('listitem', { name: copy.names.units.infantry.plural })

const textIn = (container: HTMLElement, text: string): HTMLElement | null =>
  within(container).queryByText(
    (_, element) =>
      element?.textContent === text &&
      Array.from(element.children).every((child) => child.textContent !== text),
  )

const line = (text: string): HTMLElement | null => textIn(armySection(), text)

const returnCountdown = (): HTMLElement => within(armySection()).getByRole('timer')

const recallButton = (): HTMLElement | null =>
  within(armySection()).queryByRole('button', { name: 'Retirar la marcha: 12 infantes' })

it('shows an attack outbound with the camp it marches on', async () => {
  await showFief(answering(attackUnderway))

  expect(line('Marcha al ataque: 12 infantes a provincia 2, parcela 7')).not.toBeNull()
  expect(line('Campamento: nivel 1, fuerza 6')).not.toBeNull()
  expect(within(returnCountdown()).getByText('Vuelta en')).toBeDefined()
  expect(within(returnCountdown()).getByText('29:30')).toBeDefined()
  expect(line('Botín: 120 de madera, 120 de piedra y 120 de oro')).not.toBeNull()
  expect(textIn(infantryCard(), '8 infantes en casa, 12 infantes de marcha')).not.toBeNull()
})

it('turns an attack to returning at the battle with no foraging phase', async () => {
  await showFief(answering(attackFightingInFortySeconds))
  await passSeconds(39)
  expect(line('Marcha al ataque: 12 infantes a provincia 2, parcela 7')).not.toBeNull()

  await passSeconds(1)

  expect(line('Vuelta del ataque: 12 infantes desde provincia 2, parcela 7')).not.toBeNull()
  expect(line('Marcha al ataque: 12 infantes a provincia 2, parcela 7')).toBeNull()
  expect(within(armySection()).queryByText(/Forrajeo/)).toBeNull()
  expect(within(returnCountdown()).getByText('15:00')).toBeDefined()
})

it('reads the fief again at the battle', async () => {
  const fief = answering(attackFightingInFortySeconds)
  await showFief(fief)

  await passSeconds(39)
  expect(fief).toHaveBeenCalledTimes(1)
  await passSeconds(1)

  expect(fief).toHaveBeenCalledTimes(2)
})

it('shows the survivors and the loot after a won battle', async () => {
  await showFief(answering(attackFightingInFortySeconds, attackWon))

  await passSeconds(40)

  expect(line('Vuelta del ataque: 9 infantes desde provincia 2, parcela 7')).not.toBeNull()
  expect(line('Campamento: nivel 1, fuerza 6')).not.toBeNull()
  expect(line('Botín: 120 de madera, 120 de piedra y 120 de oro')).not.toBeNull()
  expect(textIn(infantryCard(), '8 infantes en casa, 9 infantes de marcha')).not.toBeNull()
})

it('shows the march slot idle after a lost battle', async () => {
  await showFief(answering(attackFightingInFortySeconds, attackLost))

  await passSeconds(40)

  expect(within(armySection()).getByText('El cuartel no tiene marcha en curso.')).toBeDefined()
  expect(textIn(infantryCard(), '8 infantes en casa')).not.toBeNull()
  expect(within(infantryCard()).queryByText(/de marcha/)).toBeNull()
})

it('offers the recall on an attack only before the battle', async () => {
  await showFief(answering(attackFightingInFortySeconds, attackWon))
  await passSeconds(39)
  expect(recallButton()?.textContent).toBe('Retirar la marcha')

  await passSeconds(1)

  expect(recallButton()).toBeNull()
  expect(within(armySection()).queryByRole('button', { name: /Retirar la marcha/ })).toBeNull()
})

it('shows a forage march as before', async () => {
  const fief = answering(forageArrivingInFortySeconds)
  await showFief(fief)
  expect(line('Marcha de ida: 12 infantes a provincia 2, parcela 7')).not.toBeNull()
  expect(within(armySection()).queryByText(/Campamento/)).toBeNull()

  await passSeconds(40)

  expect(line('Forrajeo: 12 infantes en provincia 2, parcela 7')).not.toBeNull()
  expect(fief).toHaveBeenCalledTimes(1)
})

it('shows a recalled attack as a march on its way back', async () => {
  const recalledAt = instantAfterRead(-60)
  const recalledOnTheRoad: FiefOverview = {
    ...barracksBuilt,
    march: {
      ...attackDeparted(300),
      loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
      arrivesAt: recalledAt,
      leavesAt: recalledAt,
      returnsAt: instantAfterRead(180),
      recalledAt,
    },
  }
  await showFief(answering(recalledOnTheRoad))

  expect(line('Marcha de vuelta: 12 infantes desde provincia 2, parcela 7')).not.toBeNull()
  expect(within(armySection()).queryByText(/Vuelta del ataque/)).toBeNull()
  expect(within(armySection()).queryByText(/Campamento/)).toBeNull()
})
