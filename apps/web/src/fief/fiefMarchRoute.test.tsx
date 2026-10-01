import type { FiefOverview } from '@mygame/contracts'
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownFief, knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'
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
  units: { infantry: 16, cavalry: 0 },
}

const twoHourForageDeparted = (secondsBeforeRead: number): FiefOverview => ({
  ...barracksBuilt,
  march: {
    order: 'forage',
    province: 2,
    plot: 5,
    terrain: 'uplands',
    infantry: 10,
    stayHours: 2,
    departedAt: instantAfterRead(-secondsBeforeRead),
    oneWaySeconds: 840,
    loot: { wood: 200, stone: 200, iron: 0, gold: 0, food: 0 },
    arrivesAt: instantAfterRead(840 - secondsBeforeRead),
    leavesAt: instantAfterRead(8040 - secondsBeforeRead),
    returnsAt: instantAfterRead(8880 - secondsBeforeRead),
    recalledAt: null,
    camp: null,
    fought: false,
  },
})

const marchUnderway = twoHourForageDeparted(30)

const marchArrivingInFortySeconds = twoHourForageDeparted(800)

const marchLeavingInFortySeconds = twoHourForageDeparted(8000)

const hourLongForage: NonNullable<FiefOverview['march']> = {
  order: 'forage',
  province: 2,
  plot: 5,
  terrain: 'uplands',
  infantry: 10,
  stayHours: 1,
  departedAt: instantAfterRead(-3610),
  oneWaySeconds: 20,
  loot: { wood: 200, stone: 200, iron: 0, gold: 0, food: 0 },
  arrivesAt: instantAfterRead(-3590),
  leavesAt: instantAfterRead(10),
  returnsAt: instantAfterRead(30),
  recalledAt: null,
  camp: null,
  fought: false,
}

const marchDueBack: FiefOverview = { ...barracksBuilt, march: hourLongForage }

const marchHome: FiefOverview = {
  ...barracksBuilt,
  resources: {
    ...barracksBuilt.resources,
    wood: { ...barracksBuilt.resources.wood, amount: 1203 },
    stone: { ...barracksBuilt.resources.stone, amount: 1003 },
  },
  readAt: instantAfterRead(30),
}

const answeredNow = (overview: FiefOverview): FiefOverview => ({
  ...overview,
  readAt: new Date(Date.now()).toISOString(),
})

const showFief = async (overrides: Partial<ApiClient>): Promise<void> => {
  renderAppAt(
    '/',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: answeredNow(marchUnderway) }),
      ...overrides,
    }),
  )
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

const phaseLine = (text: string): HTMLElement | null => textIn(armySection(), text)

const returnCountdown = (): HTMLElement => within(armySection()).getByRole('timer')

const woodCell = (): HTMLElement =>
  screen.getByRole('listitem', { name: copy.names.resources.wood })

it('shows the march slot idle with no march away', async () => {
  await showFief({ fief: async () => ({ ok: true, value: barracksBuilt }) })

  expect(within(armySection()).getByText('la marcha')).toBeDefined()
  expect(within(armySection()).getByText('El cuartel no tiene marcha en curso.')).toBeDefined()
  expect(within(armySection()).queryByRole('timer')).toBeNull()
})

it('shows the march outbound with its countdown to the return', async () => {
  await showFief({})

  expect(within(armySection()).getByText('una marcha en curso')).toBeDefined()
  expect(phaseLine('Marcha de ida: 10 infantes a provincia 2, parcela 5')).not.toBeNull()
  expect(within(returnCountdown()).getByText('Vuelta en')).toBeDefined()
  expect(within(returnCountdown()).getByText('2 h 27 min')).toBeDefined()
})

it('turns the march to foraging at its arrival without a read', async () => {
  const fief = vi.fn(async () => ({
    ok: true as const,
    value: answeredNow(marchArrivingInFortySeconds),
  }))
  await showFief({ fief })
  await passSeconds(39)
  const readsBeforeArrival = fief.mock.calls.length
  expect(phaseLine('Marcha de ida: 10 infantes a provincia 2, parcela 5')).not.toBeNull()

  await passSeconds(1)

  expect(phaseLine('Forrajeo: 10 infantes en provincia 2, parcela 5')).not.toBeNull()
  expect(phaseLine('Marcha de ida: 10 infantes a provincia 2, parcela 5')).toBeNull()
  expect(within(returnCountdown()).getByText('2 h 14 min')).toBeDefined()
  expect(fief).toHaveBeenCalledTimes(readsBeforeArrival)
})

it('turns the march to returning when the stay ends', async () => {
  const fief = vi.fn(async () => ({
    ok: true as const,
    value: answeredNow(marchLeavingInFortySeconds),
  }))
  await showFief({ fief })
  await passSeconds(39)
  const readsBeforeLeaving = fief.mock.calls.length
  expect(phaseLine('Forrajeo: 10 infantes en provincia 2, parcela 5')).not.toBeNull()

  await passSeconds(1)

  expect(phaseLine('Marcha de vuelta: 10 infantes desde provincia 2, parcela 5')).not.toBeNull()
  expect(phaseLine('Forrajeo: 10 infantes en provincia 2, parcela 5')).toBeNull()
  expect(within(returnCountdown()).getByText('14:00')).toBeDefined()
  expect(fief).toHaveBeenCalledTimes(readsBeforeLeaving)
})

it('shows the loot on the way', async () => {
  await showFief({})

  expect(phaseLine('Botín: 200 de madera y 200 de piedra')).not.toBeNull()
})

it('counts the infantry at home and away', async () => {
  await showFief({})

  expect(textIn(infantryCard(), '6 infantes en casa, 10 infantes de marcha')).not.toBeNull()
})

it('counts the infantry at home alone with no march away', async () => {
  await showFief({ fief: async () => ({ ok: true, value: barracksBuilt }) })

  expect(textIn(infantryCard(), '16 infantes en casa')).not.toBeNull()
  expect(within(infantryCard()).queryByText(/de marcha/)).toBeNull()
})

it('reads the fief again when the march returns', async () => {
  const fief = vi.fn(async () => ({ ok: true as const, value: marchDueBack }))
  await showFief({ fief })

  await passSeconds(10)
  expect(phaseLine('Marcha de vuelta: 10 infantes desde provincia 2, parcela 5')).not.toBeNull()
  await passSeconds(19)
  expect(fief).toHaveBeenCalledTimes(1)
  await passSeconds(1)

  expect(fief).toHaveBeenCalledTimes(2)
})

it('shows the loot in the stocks after the return read', async () => {
  const fief = vi
    .fn<ApiClient['fief']>()
    .mockResolvedValueOnce({ ok: true, value: marchDueBack })
    .mockResolvedValue({ ok: true, value: marchHome })
  await showFief({ fief })
  await passSeconds(29)
  expect(within(woodCell()).getByText('1 002')).toBeDefined()

  await passSeconds(1)

  expect(within(woodCell()).getByText('1 203')).toBeDefined()
  expect(within(armySection()).getByText('El cuartel no tiene marcha en curso.')).toBeDefined()
  expect(textIn(infantryCard(), '16 infantes en casa')).not.toBeNull()
})

it('waits for the minute re-read when the march returns past the longest timeout', async () => {
  const returnsPastTheLongestTimeout: FiefOverview = {
    ...barracksBuilt,
    march: { ...hourLongForage, returnsAt: instantAfterRead(2 ** 31 / 1000 + 60) },
  }
  const fief = vi.fn(async () => ({ ok: true as const, value: returnsPastTheLongestTimeout }))
  await showFief({ fief })

  await passSeconds(59)
  expect(fief).toHaveBeenCalledTimes(1)
  await passSeconds(1)

  expect(fief).toHaveBeenCalledTimes(2)
})

const recallButton = (): HTMLElement | null =>
  within(armySection()).queryByRole('button', { name: 'Retirar la marcha: 10 infantes' })

it('offers the recall on the way out', async () => {
  await showFief({})

  expect(recallButton()).not.toBeNull()
  expect(recallButton()?.textContent).toBe('Retirar la marcha')
})

it('offers the recall while foraging', async () => {
  await showFief({
    fief: async () => ({ ok: true, value: answeredNow(twoHourForageDeparted(900)) }),
  })

  expect(phaseLine('Forrajeo: 10 infantes en provincia 2, parcela 5')).not.toBeNull()
  expect(recallButton()).not.toBeNull()
})

it('offers no recall on the way back', async () => {
  await showFief({
    fief: async () => ({ ok: true, value: answeredNow(twoHourForageDeparted(8100)) }),
  })

  expect(phaseLine('Marcha de vuelta: 10 infantes desde provincia 2, parcela 5')).not.toBeNull()
  expect(recallButton()).toBeNull()
})

it('withdraws the recall when the stay ends between reads', async () => {
  await showFief({
    fief: async () => ({ ok: true, value: answeredNow(marchLeavingInFortySeconds) }),
  })
  await passSeconds(39)
  expect(recallButton()).not.toBeNull()

  await passSeconds(1)

  expect(recallButton()).toBeNull()
})

it('recalls the march named by its departure', async () => {
  const recallMarch = vi.fn(async () => ({ ok: true as const, value: barracksBuilt }))
  await showFief({ recallMarch })

  fireEvent.click(recallButton() as HTMLElement)
  await passSeconds(0)

  expect(recallMarch).toHaveBeenCalledWith({ departedAt: instantAfterRead(-30) })
})

const recalledAtThePlot = (): FiefOverview => {
  const foraging = twoHourForageDeparted(2640)
  const now = new Date(Date.now()).toISOString()
  return {
    ...foraging,
    march: {
      ...(foraging.march as NonNullable<FiefOverview['march']>),
      loot: { wood: 15, stone: 15, iron: 0, gold: 0, food: 0 },
      leavesAt: now,
      returnsAt: new Date(Date.now() + 840_000).toISOString(),
      recalledAt: now,
    },
    readAt: now,
  }
}

it('shows the march returning with its new countdown after the recall', async () => {
  await showFief({
    fief: async () => ({ ok: true, value: answeredNow(twoHourForageDeparted(2640)) }),
    recallMarch: async () => ({ ok: true, value: recalledAtThePlot() }),
  })

  fireEvent.click(recallButton() as HTMLElement)
  await passSeconds(0)

  expect(phaseLine('Marcha de vuelta: 10 infantes desde provincia 2, parcela 5')).not.toBeNull()
  expect(within(returnCountdown()).getByText('14:00')).toBeDefined()
  expect(phaseLine('Botín: 15 de madera y 15 de piedra')).not.toBeNull()
  expect(recallButton()).toBeNull()
})

it('leaves the loot out after a recall on the road', async () => {
  const now = new Date(Date.now()).toISOString()
  const recalledOnTheRoad: FiefOverview = {
    ...marchUnderway,
    march: {
      ...(marchUnderway.march as NonNullable<FiefOverview['march']>),
      loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
      arrivesAt: now,
      leavesAt: now,
      returnsAt: instantAfterRead(30),
      recalledAt: now,
    },
    readAt: now,
  }
  await showFief({ recallMarch: async () => ({ ok: true, value: recalledOnTheRoad }) })

  fireEvent.click(recallButton() as HTMLElement)
  await passSeconds(0)

  expect(within(returnCountdown()).getByText('0:30')).toBeDefined()
  expect(within(armySection()).queryByText(/Botín/)).toBeNull()
})

it('shows the refusal the api answered', async () => {
  const alreadyReturning = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: false,
    refusal: 'MarchAlreadyReturning',
  })
  await showFief({ recallMarch: alreadyReturning })

  fireEvent.click(recallButton() as HTMLElement)
  await passSeconds(0)

  expect(within(armySection()).getByRole('alert').textContent).toBe(
    'Esa marcha ya viene de vuelta. Espera a que llegue.',
  )

  cleanup()
  const notFound = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: false,
    refusal: 'MarchNotFound',
  })
  await showFief({ recallMarch: notFound })

  fireEvent.click(recallButton() as HTMLElement)
  await passSeconds(0)

  expect(within(armySection()).getByRole('alert').textContent).toBe(
    'El cuartel ya no tiene esa marcha en curso. No queda nada que retirar.',
  )
})

it('sends one recall on a double click', async () => {
  let answer: (outcome: ApiOutcome<FiefOverview>) => void = () => undefined
  const recallMarch = vi.fn(
    () =>
      new Promise<ApiOutcome<FiefOverview>>((settle) => {
        answer = settle
      }),
  )
  await showFief({ recallMarch })

  const button = recallButton() as HTMLElement
  act(() => {
    button.click()
    button.click()
  })
  expect(recallButton()?.hasAttribute('disabled')).toBe(true)
  answer({ ok: true, value: barracksBuilt })
  await passSeconds(0)

  expect(recallMarch).toHaveBeenCalledTimes(1)
})
