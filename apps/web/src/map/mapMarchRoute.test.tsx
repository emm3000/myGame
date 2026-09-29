import type { DispatchMarchRequest, FiefOverview, ProvinceMap } from '@mygame/contracts'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownFief, knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

const fiefWithTenInfantry: FiefOverview = {
  ...knownFief,
  coordinates: { kingdom: 1, province: 1, plot: 1 },
  units: { infantry: 10 },
}

const provinceOf = (
  province: number,
  terrain: ProvinceMap['terrain'],
  held: Readonly<Record<number, { readonly name: string; readonly isOwn: boolean }>>,
): ProvinceMap => ({
  kingdom: 1,
  province,
  lastProvince: 3,
  terrain,
  plots: Array.from({ length: 15 }, (_, index) => ({
    plot: index + 1,
    fief: held[index + 1] ?? null,
    camp: null,
  })),
})

const ownProvince = provinceOf(1, 'lowlands', {
  1: { name: 'Fuenteclara', isOwn: true },
  3: { name: 'Penalba', isOwn: false },
})

const uplands = provinceOf(2, 'uplands', { 3: { name: 'Castrofrio', isOwn: false } })

const marchAway: NonNullable<FiefOverview['march']> = {
  province: 2,
  plot: 5,
  terrain: 'uplands',
  infantry: 10,
  stayHours: 2,
  departedAt: '2026-09-22T12:00:00.000Z',
  oneWaySeconds: 840,
  loot: { wood: 60, stone: 60, iron: 0, gold: 0, food: 0 },
  arrivesAt: '2026-09-22T12:14:00.000Z',
  leavesAt: '2026-09-22T14:14:00.000Z',
  returnsAt: '2026-09-22T14:28:00.000Z',
  recalledAt: null,
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

const showMap = async (
  map: ProvinceMap,
  overrides: Partial<ApiClient> = {},
): Promise<HTMLElement[]> => {
  renderAppAt(
    `/mapa/${map.province}`,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: fiefWithTenInfantry }),
      provinceMap: async () => ({ ok: true, value: map }),
      ...overrides,
    }),
  )
  const list = await screen.findByRole('list', {
    name: copy.map.heading(map.kingdom, map.province),
  })
  await screen.findAllByRole('button', { name: /^Enviar una marcha a parcela/ })
  return within(list).getAllByRole('listitem')
}

const openMarchTo = async (
  map: ProvinceMap,
  plot: number,
  overrides: Partial<ApiClient> = {},
): Promise<HTMLElement> => {
  await showMap(map, overrides)
  fireEvent.click(screen.getByRole('button', { name: `Enviar una marcha a parcela ${plot}` }))
  return screen.getByRole('form', { name: `Marcha a provincia ${map.province}, parcela ${plot}` })
}

const type = (form: HTMLElement, label: string, value: string): void => {
  fireEvent.change(within(form).getByLabelText(label), { target: { value } })
}

const previewOf = (form: HTMLElement): string[] =>
  within(form)
    .queryAllByRole('listitem')
    .map((line) => line.textContent ?? '')

const sendButton = (form: HTMLElement): HTMLButtonElement =>
  within(form).getByRole('button', { name: /^Enviar una marcha/ }) as HTMLButtonElement

it('offers the march on a free plot only', async () => {
  const plots = await showMap(ownProvince)

  const actionOf = (plot: HTMLElement): HTMLElement | null =>
    within(plot).queryByRole('button', { name: /^Enviar una marcha/ })
  expect(actionOf(plots[1] as HTMLElement)?.getAttribute('aria-label')).toBe(
    'Enviar una marcha a parcela 2',
  )
  expect(actionOf(plots[0] as HTMLElement)).toBeNull()
  expect(actionOf(plots[2] as HTMLElement)).toBeNull()
})

it('previews the road time from the fief to the plot', async () => {
  const form = await openMarchTo(uplands, 5)

  expect(previewOf(form)).toContain('Camino de ida: 14:00')
})

it('previews the loot the plot terrain yields', async () => {
  const form = await openMarchTo(uplands, 5)

  type(form, 'Infantes a enviar', '10')
  type(form, 'Horas de forrajeo', '2')

  expect(previewOf(form)).toEqual([
    'Camino de ida: 14:00',
    'Vuelta en 2 h 28 min',
    'Botín: 60 de madera y 60 de piedra',
  ])
})

it('previews the loot capped by the carry', async () => {
  const lightCarry: FiefOverview = {
    ...fiefWithTenInfantry,
    forageTerms: { ...fiefWithTenInfantry.forageTerms, carryPerInfantry: 4 },
  }
  const form = await openMarchTo(uplands, 5, {
    fief: async () => ({ ok: true, value: lightCarry }),
  })

  type(form, 'Infantes a enviar', '10')
  type(form, 'Horas de forrajeo', '1')

  expect(previewOf(form)).toContain('Botín: 20 de madera y 20 de piedra')
})

it('blocks a march without infantry at home', async () => {
  const noInfantry: FiefOverview = { ...fiefWithTenInfantry, units: { infantry: 0 } }
  const dispatchMarch = vi.fn(async () => ({ ok: true, value: noInfantry }) as const)
  const form = await openMarchTo(uplands, 5, {
    fief: async () => ({ ok: true, value: noInfantry }),
    dispatchMarch,
  })

  type(form, 'Infantes a enviar', '10')
  fireEvent.submit(form)

  const button = sendButton(form)
  expect(button.disabled).toBe(true)
  expect(button.getAttribute('aria-label')).toBe(
    'Enviar una marcha. Necesitas 10 infantes en casa y tienes 0.',
  )
  expect(dispatchMarch).not.toHaveBeenCalled()
})

it('blocks a march while another is away', async () => {
  const away: FiefOverview = { ...fiefWithTenInfantry, march: marchAway }
  const dispatchMarch = vi.fn(async () => ({ ok: true, value: away }) as const)
  const form = await openMarchTo(uplands, 7, {
    fief: async () => ({ ok: true, value: away }),
    dispatchMarch,
  })

  fireEvent.submit(form)

  expect(sendButton(form).getAttribute('aria-label')).toBe(
    'Enviar una marcha. Ya hay una marcha en curso.',
  )
  expect((within(form).getByLabelText('Infantes a enviar') as HTMLInputElement).disabled).toBe(true)
  expect(dispatchMarch).not.toHaveBeenCalled()
})

it('counts the infantry at home without the men away', async () => {
  const twelveAway: FiefOverview = {
    ...fiefWithTenInfantry,
    units: { infantry: 20 },
    march: { ...marchAway, infantry: 12 },
  }
  const form = await openMarchTo(uplands, 7, {
    fief: async () => ({ ok: true, value: twelveAway }),
  })

  expect(form.closest('article')?.querySelector('header')?.textContent).toContain(
    '8 infantes en casa',
  )
})

it('blocks an infantry count that is not a whole count from 1', async () => {
  const dispatchMarch = vi.fn(async () => ({ ok: true, value: fiefWithTenInfantry }) as const)
  const form = await openMarchTo(uplands, 5, { dispatchMarch })

  type(form, 'Infantes a enviar', '0')
  fireEvent.submit(form)

  expect(sendButton(form).getAttribute('aria-label')).toBe(
    'Enviar una marcha. Un número entero, al menos 1.',
  )
  expect(previewOf(form)).toEqual([])
  expect(dispatchMarch).not.toHaveBeenCalled()
})

it('closes the march form when browsing to another province', async () => {
  const form = await openMarchTo(uplands, 7, {
    provinceMap: async (province) => ({
      ok: true,
      value: provinceOf(province ?? 2, 'uplands', {}),
    }),
  })
  expect(form).toBeDefined()

  fireEvent.click(screen.getByRole('button', { name: 'Provincia siguiente' }))
  await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 3' })
  fireEvent.click(screen.getByRole('button', { name: 'Provincia anterior' }))
  await screen.findByRole('heading', { level: 3, name: 'Vadoalto, provincia 2' })

  expect(screen.queryByRole('form', { name: 'Marcha a provincia 2, parcela 7' })).toBeNull()
})

it('blocks a stay past the longest', async () => {
  const dispatchMarch = vi.fn(async () => ({ ok: true, value: fiefWithTenInfantry }) as const)
  const form = await openMarchTo(uplands, 5, { dispatchMarch })

  type(form, 'Horas de forrajeo', '9')
  fireEvent.submit(form)

  expect(sendButton(form).getAttribute('aria-label')).toBe(
    'Enviar una marcha. Un número entero, de 1 a 8.',
  )
  expect(previewOf(form)).toEqual([])
  expect(dispatchMarch).not.toHaveBeenCalled()
})

it('sends the march and shows it sent', async () => {
  const dispatchMarch = vi.fn(
    async (_request: DispatchMarchRequest) =>
      ({ ok: true, value: { ...fiefWithTenInfantry, march: marchAway } }) as const,
  )
  const form = await openMarchTo(uplands, 5, { dispatchMarch })

  type(form, 'Infantes a enviar', '10')
  type(form, 'Horas de forrajeo', '2')
  fireEvent.click(sendButton(form))

  const sent = await screen.findByRole('status')
  expect(dispatchMarch).toHaveBeenCalledWith({ province: 2, plot: 5, infantry: 10, stayHours: 2 })
  expect(sent.textContent).toContain('Marcha de ida: 10 infantes a provincia 2, parcela 5')
  expect(sent.textContent).toContain('Vuelta en 2 h 28 min')
  expect(sent.textContent).toContain('Botín: 60 de madera y 60 de piedra')
  expect(screen.queryByRole('form', { name: 'Marcha a provincia 2, parcela 5' })).toBeNull()
})

it('shows the refusal the api answered', async () => {
  const form = await openMarchTo(uplands, 5, {
    dispatchMarch: async () => ({ ok: false, refusal: 'PlotHeld' }),
  })

  fireEvent.click(sendButton(form))

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.PlotHeld)
})

it('sends one march on a double click', async () => {
  const answer = deferred<ApiOutcome<FiefOverview>>()
  const dispatchMarch = vi.fn(() => answer.promise)
  const form = await openMarchTo(uplands, 5, { dispatchMarch })

  const button = sendButton(form)
  act(() => {
    button.click()
    button.click()
  })
  answer.resolve({ ok: true, value: { ...fiefWithTenInfantry, march: marchAway } })

  await waitFor(() => expect(screen.getByRole('status')).toBeDefined())
  expect(dispatchMarch).toHaveBeenCalledTimes(1)
})
