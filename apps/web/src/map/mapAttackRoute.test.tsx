import type { DispatchAttackRequest, FiefOverview, ProvinceMap } from '@mygame/contracts'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'
import { accessibleDescriptionOf } from '../design-system/accessibleDescriptionOf.testSupport'

const fiefWithTenInfantry: FiefOverview = {
  ...knownFief,
  coordinates: { kingdom: 1, province: 1, plot: 1 },
  units: { infantry: 10, cavalry: 0, archer: 0, settler: 0 },
}

const uplandsWithCamps: ProvinceMap = {
  kingdom: 1,
  province: 2,
  lastProvince: 3,
  terrain: 'uplands',
  plots: Array.from({ length: 15 }, (_, index) => ({
    plot: index + 1,
    fief: index + 1 === 3 ? { name: 'Castrofrio', isOwn: false } : null,
    camp:
      index + 1 === 7
        ? { tier: 1, strength: 6 }
        : index + 1 === 9
          ? { tier: 2, strength: 15 }
          : null,
    reservation: null,
  })),
}

const attackAway: NonNullable<FiefOverview['march']> = {
  order: 'attack',
  province: 2,
  plot: 7,
  terrain: 'uplands',
  units: { infantry: 10, cavalry: 0, archer: 0, settler: 0 },
  stayHours: 0,
  departedAt: '2026-09-22T12:00:00.000Z',
  oneWaySeconds: 960,
  loot: { wood: 96, stone: 96, iron: 0, gold: 96, food: 0 },
  arrivesAt: '2026-09-22T12:16:00.000Z',
  leavesAt: '2026-09-22T12:16:00.000Z',
  returnsAt: '2026-09-22T12:32:00.000Z',
  recalledAt: null,
  camp: { tier: 1, strength: 6 },
  fought: false,
}

const fiefWithAttackAway: FiefOverview = { ...fiefWithTenInfantry, march: attackAway }

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

const showMap = async (overrides: Partial<ApiClient> = {}): Promise<HTMLElement[]> => {
  renderAppAt(
    `${knownFiefPath}/mapa/${uplandsWithCamps.province}`,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: fiefWithTenInfantry }),
      provinceMap: async () => ({ ok: true, value: uplandsWithCamps }),
      ...overrides,
    }),
  )
  const list = await screen.findByRole('list', {
    name: copy.map.heading(uplandsWithCamps.kingdom, uplandsWithCamps.province),
  })
  await screen.findAllByRole('button', { name: /^Enviar una marcha a parcela/ })
  return within(list).getAllByRole('listitem')
}

const openAttackOn = async (
  plot: number,
  overrides: Partial<ApiClient> = {},
): Promise<HTMLElement> => {
  await showMap(overrides)
  fireEvent.click(screen.getByRole('button', { name: `Atacar el campamento en parcela ${plot}` }))
  return screen.getByRole('form', { name: `Ataque a provincia 2, parcela ${plot}` })
}

const typeInfantry = (form: HTMLElement, value: string): void => {
  fireEvent.change(within(form).getByLabelText('Infantes a enviar'), { target: { value } })
}

const attackButton = (form: HTMLElement): HTMLButtonElement =>
  within(form).getByRole('button', { name: /^Atacar el campamento/ }) as HTMLButtonElement

const previewOf = (form: HTMLElement): string[] =>
  within(form)
    .queryAllByRole('listitem')
    .map((line) => line.textContent ?? '')

it('reads a camp tier and strength on its plot', async () => {
  const plots = await showMap()

  expect(plots[6]?.textContent).toContain('Campamento de bandidos')
  expect(plots[6]?.textContent).toContain('nivel 1, fuerza 6')
  expect(plots[8]?.textContent).toContain('nivel 2, fuerza 15')
  expect(plots[6]?.textContent).not.toContain('libre')
  expect(plots[4]?.textContent).toContain('libre')
})

it('shows the art of its tier on the attack form', async () => {
  await openAttackOn(9)

  expect(screen.getByRole('presentation').getAttribute('src')).toBe('/art/camps/camp-2.png')
})

it('offers the attack on a camp plot and no forage', async () => {
  const plots = await showMap()

  const campPlot = within(plots[6] as HTMLElement)
  expect(campPlot.getByRole('button').getAttribute('aria-label')).toBe(
    'Atacar el campamento en parcela 7',
  )
  expect(campPlot.queryByRole('button', { name: /^Enviar una marcha/ })).toBeNull()
  expect(
    within(plots[4] as HTMLElement).queryByRole('button', { name: /^Atacar el campamento/ }),
  ).toBeNull()
})

it('previews a win with the losses and the loot', async () => {
  const form = await openAttackOn(7)

  typeInfantry(form, '10')

  expect(previewOf(form)).toEqual([
    'Camino de ida: 16:00',
    'Vuelta en 32:00',
    'Campamento: nivel 1, fuerza 6',
    'Batalla: ganada',
    'Bajas: 4 infantes',
    'Bajas de los bandidos: 6',
    'Vuelven: 6 infantes',
    'Botín: 96 de madera, 96 de piedra y 96 de oro',
  ])
})

it('previews the loss of every man', async () => {
  const form = await openAttackOn(9)

  typeInfantry(form, '10')

  expect(previewOf(form)).toEqual([
    'Camino de ida: 18:00',
    'Vuelta en 36:00',
    'Campamento: nivel 2, fuerza 15',
    'Batalla: perdida',
    'Bajas: 10 infantes',
    'Bajas de los bandidos: 7',
    'Vuelven: 0 infantes',
  ])
})

it('gives a tie to the camp', async () => {
  const form = await openAttackOn(7)

  typeInfantry(form, '6')

  expect(previewOf(form)).toContain('Batalla: perdida')
  expect(previewOf(form)).toContain('Bajas: 6 infantes')
  expect(previewOf(form)).toContain('Bajas de los bandidos: 5')
})

it('counts the losses in integers', async () => {
  const campAtTen: ProvinceMap = {
    ...uplandsWithCamps,
    plots: uplandsWithCamps.plots.map((plot) =>
      plot.plot === 9 ? { ...plot, camp: { tier: 2, strength: 10 } } : plot,
    ),
  }
  const form = await openAttackOn(9, {
    fief: async () => ({
      ok: true,
      value: { ...fiefWithTenInfantry, units: { infantry: 25, cavalry: 0, archer: 0, settler: 0 } },
    }),
    provinceMap: async () => ({ ok: true, value: campAtTen }),
  })

  typeInfantry(form, '25')

  expect(previewOf(form)).toContain('Bajas: 4 infantes')
  expect(previewOf(form)).toContain('Vuelven: 21 infantes')
})

it('blocks an attack without infantry at home', async () => {
  const noInfantry: FiefOverview = {
    ...fiefWithTenInfantry,
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
  }
  const dispatchAttack = vi.fn(async () => ({ ok: true, value: noInfantry }) as const)
  const form = await openAttackOn(7, {
    fief: async () => ({ ok: true, value: noInfantry }),
    dispatchAttack,
  })

  fireEvent.submit(form)

  expect(accessibleDescriptionOf(attackButton(form))).toBe(
    'Necesitas 1 infante en casa y tienes 0.',
  )
  expect(dispatchAttack).not.toHaveBeenCalled()
})

it('blocks an attack while a march is away', async () => {
  const dispatchAttack = vi.fn(async () => ({ ok: true, value: fiefWithAttackAway }) as const)
  const form = await openAttackOn(9, {
    fief: async () => ({ ok: true, value: fiefWithAttackAway }),
    dispatchAttack,
  })

  fireEvent.submit(form)

  expect(accessibleDescriptionOf(attackButton(form))).toBe('Ya hay una marcha en curso.')
  expect((within(form).getByLabelText('Infantes a enviar') as HTMLInputElement).disabled).toBe(true)
  expect(dispatchAttack).not.toHaveBeenCalled()
})

it('blocks a count that is not a whole number from 0', async () => {
  const dispatchAttack = vi.fn(async () => ({ ok: true, value: fiefWithAttackAway }) as const)
  const form = await openAttackOn(7, { dispatchAttack })

  typeInfantry(form, '-1')
  fireEvent.submit(form)

  expect(accessibleDescriptionOf(attackButton(form))).toBe('Un número entero, 0 o más.')
  expect(previewOf(form)).toEqual([])
  expect(dispatchAttack).not.toHaveBeenCalled()
})

it('sends the attack and shows it sent', async () => {
  const dispatchAttack = vi.fn(
    async (_fiefId: string, _request: DispatchAttackRequest) =>
      ({ ok: true, value: fiefWithAttackAway }) as const,
  )
  const form = await openAttackOn(7, { dispatchAttack })

  typeInfantry(form, '10')
  fireEvent.click(attackButton(form))

  const sent = await screen.findByRole('status')
  expect(dispatchAttack).toHaveBeenCalledWith(knownFief.id, {
    province: 2,
    plot: 7,
    units: { infantry: 10, cavalry: 0, archer: 0, settler: 0 },
  })
  expect(sent.textContent).toContain('Marcha al ataque: 10 infantes a provincia 2, parcela 7')
  expect(sent.textContent).toContain('Campamento: nivel 1, fuerza 6')
  expect(sent.textContent).toContain('Vuelta en 32:00')
  expect(sent.textContent).toContain('Botín: 96 de madera, 96 de piedra y 96 de oro')
  expect(screen.queryByRole('form', { name: 'Ataque a provincia 2, parcela 7' })).toBeNull()
})

it('shows the camp strength the server fixed at the send', async () => {
  const grownCamp: FiefOverview = {
    ...fiefWithAttackAway,
    march: { ...attackAway, camp: { tier: 1, strength: 4 } },
  }
  const form = await openAttackOn(7, {
    dispatchAttack: async () => ({ ok: true, value: grownCamp }),
  })

  fireEvent.click(attackButton(form))

  expect((await screen.findByRole('status')).textContent).toContain('Campamento: nivel 1, fuerza 4')
})

it('shows the refusal the api answered', async () => {
  const form = await openAttackOn(7, {
    dispatchAttack: async () => ({ ok: false, refusal: 'PlotHasNoCamp' }),
  })

  fireEvent.click(attackButton(form))

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.PlotHasNoCamp)
})

it('sends one attack on a double click', async () => {
  const answer = deferred<ApiOutcome<FiefOverview>>()
  const dispatchAttack = vi.fn(() => answer.promise)
  const form = await openAttackOn(7, { dispatchAttack })

  const button = attackButton(form)
  act(() => {
    button.click()
    button.click()
  })
  answer.resolve({ ok: true, value: fiefWithAttackAway })

  await waitFor(() => expect(screen.getByRole('status')).toBeDefined())
  expect(dispatchAttack).toHaveBeenCalledTimes(1)
})
