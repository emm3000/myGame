import type { FiefOverview, ProvinceMap } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'
import { stubMatchMedia } from './stubMatchMedia.testSupport'

afterEach(() => {
  vi.unstubAllGlobals()
})

const fiefWithTenInfantry: FiefOverview = {
  ...knownFief,
  coordinates: { kingdom: 1, province: 1, plot: 1 },
  units: { infantry: 10, cavalry: 0, archer: 0, settler: 0 },
}

const freeProvince: ProvinceMap = {
  kingdom: 1,
  province: 2,
  lastProvince: 3,
  terrain: 'uplands',
  plots: Array.from({ length: 15 }, (_, index) => ({
    plot: index + 1,
    fief: null,
    camp: null,
    reservation: null,
  })),
}

const marchAway: NonNullable<FiefOverview['march']> = {
  order: 'forage',
  province: 2,
  plot: 3,
  terrain: 'uplands',
  units: { infantry: 1, cavalry: 0, archer: 0, settler: 0 },
  stayHours: 1,
  departedAt: '2026-09-22T12:00:00.000Z',
  oneWaySeconds: 840,
  loot: { wood: 6, stone: 6, iron: 0, gold: 0, food: 0 },
  arrivesAt: '2026-09-22T12:14:00.000Z',
  leavesAt: '2026-09-22T13:14:00.000Z',
  returnsAt: '2026-09-22T13:28:00.000Z',
  recalledAt: null,
  camp: null,
  fought: false,
}

const showProvince = async (overrides: Partial<ApiClient> = {}): Promise<HTMLElement> => {
  renderAppAt(
    `${knownFiefPath}/mapa/2`,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: fiefWithTenInfantry }),
      provinceMap: async () => ({ ok: true, value: freeProvince }),
      ...overrides,
    }),
  )
  const list = await screen.findByRole('list', { name: copy.map.heading(1, 2) })
  await screen.findAllByRole('button', { name: /^Enviar una marcha a parcela/ })
  return list
}

const sendTo = (plot: number): HTMLElement =>
  screen.getByRole('button', { name: copy.march.sendTo(plot) })

const orderOf = (list: HTMLElement): ReadonlyArray<number | 'panel'> =>
  Array.from(list.children).map((item) => {
    const plot = freeProvince.plots.find(
      ({ plot }) => within(item as HTMLElement).queryByText(copy.map.plot(plot)) !== null,
    )
    return plot === undefined ? 'panel' : plot.plot
  })

const plotsWithPanelAfter = (place: number): ReadonlyArray<number | 'panel'> => {
  const plots = freeProvince.plots.map(({ plot }) => plot)
  return [...plots.slice(0, place), 'panel', ...plots.slice(place)]
}

it('opens the march form right after the row of the tapped plot', async () => {
  const list = await showProvince()

  fireEvent.click(sendTo(3))
  expect(orderOf(list)).toEqual(plotsWithPanelAfter(4))

  fireEvent.click(sendTo(15))
  expect(orderOf(list)).toEqual(plotsWithPanelAfter(15))

  fireEvent.click(sendTo(1))
  expect(orderOf(list)).toEqual(plotsWithPanelAfter(2))
})

it('places the panel after the row of five on a wide screen', async () => {
  stubMatchMedia(true)
  const list = await showProvince()

  fireEvent.click(sendTo(3))
  expect(orderOf(list)).toEqual(plotsWithPanelAfter(5))

  fireEvent.click(sendTo(8))
  expect(orderOf(list)).toEqual(plotsWithPanelAfter(10))

  fireEvent.click(sendTo(15))
  expect(orderOf(list)).toEqual(plotsWithPanelAfter(15))
})

it('names the open panel from the expanded action', async () => {
  await showProvince()

  fireEvent.click(sendTo(3))

  const panelId = sendTo(3).getAttribute('aria-controls')
  const form = screen.getByRole('form', { name: 'Marcha a provincia 2, parcela 3' })
  expect(document.getElementById(panelId ?? '')?.contains(form)).toBe(true)
  for (const control of document.querySelectorAll('[aria-controls]')) {
    expect(document.getElementById(control.getAttribute('aria-controls') ?? '')).not.toBeNull()
  }
})

it('names no panel from a collapsed action', async () => {
  await showProvince()

  fireEvent.click(sendTo(3))
  fireEvent.click(sendTo(3))

  expect(document.querySelectorAll('[aria-controls]')).toHaveLength(0)
})

it('moves focus to the form title when a form opens', async () => {
  await showProvince()

  fireEvent.click(sendTo(3))

  const title = screen.getByRole('heading', { level: 4, name: 'Marcha a provincia 2, parcela 3' })
  expect(document.activeElement).toBe(title)
  expect(title.getAttribute('tabindex')).toBe('-1')
})

it('leaves focus on the action when it closes the form', async () => {
  await showProvince()
  fireEvent.click(sendTo(3))
  const action = sendTo(3)
  action.focus()

  fireEvent.click(action)

  expect(screen.queryByRole('form')).toBeNull()
  expect(document.activeElement).toBe(action)
})

it('reads a refusal inside the panel', async () => {
  const list = await showProvince({
    dispatchMarch: async () => ({ ok: false, refusal: 'PlotHeld' }),
  })
  fireEvent.click(sendTo(3))

  fireEvent.click(
    within(screen.getByRole('form')).getByRole('button', { name: /^Enviar una marcha/ }),
  )

  const alert = await screen.findByRole('alert')
  const panel = list.children[4]
  expect(panel?.contains(alert)).toBe(true)
})

it('keeps the sent lines in the slot of the sent plot', async () => {
  const list = await showProvince({
    dispatchMarch: async () => ({ ok: true, value: { ...fiefWithTenInfantry, march: marchAway } }),
  })
  fireEvent.click(sendTo(3))

  fireEvent.click(
    within(screen.getByRole('form')).getByRole('button', { name: /^Enviar una marcha/ }),
  )

  const sent = await screen.findByRole('status')
  expect(orderOf(list)).toEqual(plotsWithPanelAfter(4))
  expect(list.children[4]?.contains(sent)).toBe(true)
  expect(sendTo(3).getAttribute('aria-expanded')).toBe('false')
})

it('opens no panel and keeps focus while the fief is still loading', async () => {
  renderAppAt(
    `${knownFiefPath}/mapa/2`,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: () => new Promise(() => undefined),
      provinceMap: async () => ({ ok: true, value: freeProvince }),
    }),
  )
  const list = await screen.findByRole('list', { name: copy.map.heading(1, 2) })
  const next = screen.getByRole('button', { name: copy.map.next })
  next.focus()

  expect(screen.queryAllByRole('button', { name: /parcela/ })).toHaveLength(0)
  expect(list.children).toHaveLength(freeProvince.plots.length)
  expect(document.activeElement).toBe(next)
})

it('reads a fief-load refusal under the list, outside any panel', async () => {
  renderAppAt(
    `${knownFiefPath}/mapa/2`,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: false, refusal: 'Unexpected' }),
      provinceMap: async () => ({ ok: true, value: freeProvince }),
    }),
  )
  const list = await screen.findByRole('list', { name: copy.map.heading(1, 2) })

  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toBe(copy.refusals.Unexpected)
  expect(list.contains(alert)).toBe(false)
  expect(list.children).toHaveLength(freeProvince.plots.length)
})

it('keeps focus off the form title when the screen crosses to five columns', async () => {
  const media = stubMatchMedia(false)
  const list = await showProvince()
  fireEvent.click(sendTo(3))
  const field = within(screen.getByRole('form')).getByLabelText(copy.march.countField('infantry'))
  field.focus()

  act(() => media.matchAll(true))

  expect(orderOf(list)).toEqual(plotsWithPanelAfter(5))
  expect(document.activeElement).not.toBe(
    screen.getByRole('heading', { level: 4, name: 'Marcha a provincia 2, parcela 3' }),
  )
})

it('clears a march refusal when another form opens', async () => {
  await showProvince({
    dispatchMarch: async () => ({ ok: false, refusal: 'PlotHeld' }),
  })
  fireEvent.click(sendTo(3))
  fireEvent.click(
    within(screen.getByRole('form')).getByRole('button', { name: /^Enviar una marcha/ }),
  )
  await screen.findByRole('alert')

  fireEvent.click(sendTo(8))

  expect(screen.queryByRole('alert')).toBeNull()
})
