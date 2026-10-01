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

const barracksBuilt: FiefOverview = {
  ...knownFief,
  buildings: {
    ...knownFief.buildings,
    barracks: { ...knownFief.buildings.barracks, level: 1 },
  },
  units: { infantry: 12 },
}

const orderOfTwelve: FiefOverview = {
  ...barracksBuilt,
  units: { infantry: 16 },
  recruitOrder: {
    unit: 'infantry',
    count: 12,
    delivered: 4,
    perUnitSeconds: 90,
    startedAt: '2026-09-22T11:54:00.000Z',
    endsAt: '2026-09-22T12:12:00.000Z',
  },
}

interface Deferred<T> {
  readonly promise: Promise<T>
  readonly resolve: (value: T) => void
}

const deferred = <T,>(): Deferred<T> => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

const showFief = async (overrides: Partial<ApiClient>): Promise<void> => {
  renderAppAt(
    '/',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: barracksBuilt }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const armySection = (): HTMLElement => screen.getByRole('region', { name: copy.army.section })

const infantryCard = (): HTMLElement =>
  within(armySection()).getByRole('listitem', { name: copy.names.units.infantry.plural })

const countField = (): HTMLElement =>
  within(infantryCard()).getByRole('spinbutton', { name: 'Infantes a reclutar' })

const recruitButton = (): HTMLElement => within(infantryCard()).getByRole('button')

const cancelButton = (): HTMLElement =>
  within(armySection()).getByRole('button', { name: 'Cancelar la leva: 12 infantes' })

const unitCountOf = (card: HTMLElement, text: string): HTMLElement =>
  within(card).getByText(
    (_, element) =>
      element?.textContent === text &&
      Array.from(element.children).every((child) => child.textContent !== text),
  )

const typeCount = (count: string): void => {
  fireEvent.change(countField(), { target: { value: count } })
}

it('shows no army section without a barracks', async () => {
  await showFief({ fief: async () => ({ ok: true, value: knownFief }) })

  expect(screen.queryByRole('region', { name: copy.army.section })).toBeNull()
})

it('shows the infantry count and the form from barracks level 1', async () => {
  await showFief({})

  expect(within(armySection()).getByText('El cuartel no tiene leva en marcha.')).toBeDefined()
  expect(within(infantryCard()).getByRole('heading', { name: 'Infantes' })).toBeDefined()
  expect(unitCountOf(infantryCard(), '12 infantes en casa')).toBeDefined()
  expect(countField()).toBeDefined()
  expect(recruitButton().textContent).toBe('Reclutar infantes · 1:30')
})

it('shows the cost and the peasants of the count typed', async () => {
  await showFief({})

  typeCount('5')

  const costs = within(infantryCard())
    .getAllByRole('listitem')
    .map((item) => item.textContent)
  expect(costs).toEqual(['100', '50', '150', '5'])
  expect(recruitButton().textContent).toBe('Reclutar infantes · 7:30')
  expect(recruitButton().hasAttribute('disabled')).toBe(false)
})

it('blocks an order the stocks cannot pay', async () => {
  const manyFreeHands: FiefOverview = {
    ...barracksBuilt,
    peasants: { ...barracksBuilt.peasants, free: 60, projectedFree: 60, lowestFree: 60 },
  }
  await showFief({ fief: async () => ({ ok: true, value: manyFreeHands }) })

  typeCount('40')

  expect(recruitButton().hasAttribute('disabled')).toBe(true)
  expect(recruitButton().getAttribute('aria-label')).toBe(
    'Reclutar infantes · 1 h. Te faltan 100 de hierro y 600 de comida.',
  )
  expect(within(infantryCard()).getByText('Te faltan 100 de hierro y 600 de comida.')).toBeDefined()
})

it('blocks an order the lowest free peasants across the build schedule cannot staff', async () => {
  const dipBeforeTheFarm: FiefOverview = {
    ...barracksBuilt,
    peasants: {
      ...barracksBuilt.peasants,
      projectedSupplied: 17,
      projectedFree: 13,
      lowestFree: 2,
    },
  }
  await showFief({ fief: async () => ({ ok: true, value: dipBeforeTheFarm }) })

  typeCount('3')

  expect(recruitButton().hasAttribute('disabled')).toBe(true)
  expect(
    within(infantryCard()).getByText('Necesitas 3 campesinos libres y tienes 2.'),
  ).toBeDefined()
})

it('refuses a count that is empty, below 1 or not whole', async () => {
  const placeRecruitOrder = vi.fn(async () => ({ ok: true as const, value: orderOfTwelve }))
  await showFief({ placeRecruitOrder })

  for (const count of ['', '0', '2.5']) {
    typeCount(count)
    fireEvent.submit(countField())
    await passSeconds(0)

    expect(recruitButton().textContent).toBe('Reclutar infantes')
    expect(recruitButton().getAttribute('aria-label')).toBe(
      'Reclutar infantes. Un número entero, al menos 1.',
    )
  }
  expect(placeRecruitOrder).not.toHaveBeenCalled()
})

it('places the order and shows it open', async () => {
  const placeRecruitOrder = vi.fn(async () => ({ ok: true as const, value: orderOfTwelve }))
  await showFief({ placeRecruitOrder })

  typeCount('8')
  fireEvent.click(recruitButton())
  await passSeconds(0)

  expect(placeRecruitOrder).toHaveBeenCalledWith({ unit: 'infantry', count: 8 })
  expect(within(armySection()).getByText('4 de 12 infantes', { exact: false })).toBeDefined()
  expect(recruitButton().getAttribute('aria-label')).toBe(
    'Reclutar infantes · 12:00. Ya hay una leva en marcha.',
  )
  expect(countField().hasAttribute('disabled')).toBe(true)
})

it('shows the refusal the api answered', async () => {
  const placeRecruitOrder = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: false,
    refusal: 'RecruitSlotBusy',
  })
  await showFief({ placeRecruitOrder })

  fireEvent.click(recruitButton())
  await passSeconds(0)

  expect(within(armySection()).getByRole('alert').textContent).toBe(
    'El cuartel ya tiene una leva en marcha. Espera a que termine.',
  )

  cleanup()
  const cancelRecruitOrder = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: false,
    refusal: 'RecruitOrderNotFound',
  })
  await showFief({ fief: async () => ({ ok: true, value: orderOfTwelve }), cancelRecruitOrder })

  fireEvent.click(cancelButton())
  await passSeconds(0)

  expect(within(armySection()).getByRole('alert').textContent).toBe(
    'El cuartel ya no tiene esa leva en marcha. No queda nada que cancelar.',
  )
})

it('sends one order on a double click', async () => {
  const answer = deferred<ApiOutcome<FiefOverview>>()
  const placeRecruitOrder = vi.fn(() => answer.promise)
  await showFief({ placeRecruitOrder })

  const button = recruitButton()
  act(() => {
    button.click()
    button.click()
  })
  answer.resolve({ ok: true, value: orderOfTwelve })
  await passSeconds(0)

  expect(placeRecruitOrder).toHaveBeenCalledTimes(1)
})

it('raises the count one unit per period between reads', async () => {
  const unitDueInHalfAMinute: FiefOverview = {
    ...orderOfTwelve,
    units: { infantry: 15 },
    recruitOrder: {
      unit: 'infantry',
      count: 12,
      delivered: 3,
      perUnitSeconds: 90,
      startedAt: '2026-09-22T11:54:30.000Z',
      endsAt: '2026-09-22T12:12:30.000Z',
    },
  }
  await showFief({ fief: async () => ({ ok: true, value: unitDueInHalfAMinute }) })

  await passSeconds(29)
  expect(unitCountOf(infantryCard(), '15 infantes en casa')).toBeDefined()
  await passSeconds(1)

  expect(unitCountOf(infantryCard(), '16 infantes en casa')).toBeDefined()
  expect(within(armySection()).getByText('4 de 12 infantes', { exact: false })).toBeDefined()
})

it('counts down to the next unit and to the last', async () => {
  await showFief({ fief: async () => ({ ok: true, value: orderOfTwelve }) })

  await passSeconds(5)

  const [nextUnit, lastUnit] = within(armySection()).getAllByRole('timer')
  expect(nextUnit?.textContent).toBe('Siguiente infante en1:25')
  expect(lastUnit?.textContent).toBe('Leva completa en11:55')
})

it('reads the fief again when the order ends', async () => {
  const lastUnitsDue: FiefOverview = {
    ...orderOfTwelve,
    recruitOrder: {
      unit: 'infantry',
      count: 3,
      delivered: 0,
      perUnitSeconds: 10,
      startedAt: '2026-09-22T12:00:00.000Z',
      endsAt: '2026-09-22T12:00:30.000Z',
    },
  }
  const fief = vi.fn(async () => ({ ok: true as const, value: lastUnitsDue }))
  await showFief({ fief })

  await passSeconds(29)
  expect(fief).toHaveBeenCalledTimes(1)
  await passSeconds(1)

  expect(fief).toHaveBeenCalledTimes(2)
})

it('shows the cancel on the order in progress', async () => {
  await showFief({ fief: async () => ({ ok: true, value: orderOfTwelve }) })

  expect(cancelButton().textContent).toBe('Cancelar la leva')
  expect(cancelButton().hasAttribute('disabled')).toBe(false)
})

it('shows no cancel with the recruit slot idle', async () => {
  await showFief({})

  expect(within(armySection()).queryByRole('button', { name: /Cancelar la leva/ })).toBeNull()
})

it('cancels the order named by its unit and start', async () => {
  const cancelRecruitOrder = vi.fn(async () => ({ ok: true as const, value: barracksBuilt }))
  await showFief({ fief: async () => ({ ok: true, value: orderOfTwelve }), cancelRecruitOrder })

  fireEvent.click(cancelButton())
  await passSeconds(0)

  expect(cancelRecruitOrder).toHaveBeenCalledWith({
    unit: 'infantry',
    startedAt: '2026-09-22T11:54:00.000Z',
  })
})

it('shows the slot idle and the delivered units after the cancel', async () => {
  const cancelledWithFiveDelivered: FiefOverview = { ...barracksBuilt, units: { infantry: 17 } }
  const cancelRecruitOrder = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: true,
    value: cancelledWithFiveDelivered,
  })
  await showFief({ fief: async () => ({ ok: true, value: orderOfTwelve }), cancelRecruitOrder })
  expect(unitCountOf(infantryCard(), '16 infantes en casa')).toBeDefined()

  fireEvent.click(cancelButton())
  await passSeconds(0)

  expect(within(armySection()).getByText('El cuartel no tiene leva en marcha.')).toBeDefined()
  expect(unitCountOf(infantryCard(), '17 infantes en casa')).toBeDefined()
  expect(within(armySection()).queryByRole('button', { name: /Cancelar la leva/ })).toBeNull()
})

it('sends one cancel on a double click', async () => {
  const answer = deferred<ApiOutcome<FiefOverview>>()
  const cancelRecruitOrder = vi.fn(() => answer.promise)
  await showFief({ fief: async () => ({ ok: true, value: orderOfTwelve }), cancelRecruitOrder })

  const button = cancelButton()
  act(() => {
    button.click()
    button.click()
  })
  expect(cancelButton().hasAttribute('disabled')).toBe(true)
  answer.resolve({ ok: true, value: barracksBuilt })
  await passSeconds(0)

  expect(cancelRecruitOrder).toHaveBeenCalledTimes(1)
})
