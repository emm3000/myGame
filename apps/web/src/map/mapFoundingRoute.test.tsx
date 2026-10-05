import type { DispatchFoundingRequest, FiefOverview, ProvinceMap } from '@mygame/contracts'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'

const sotoverdeWithASettler: FiefOverview = {
  ...knownFief,
  name: 'Sotoverde',
  coordinates: { kingdom: 1, province: 3, plot: 12 },
  buildings: {
    ...knownFief.buildings,
    barracks: { ...knownFief.buildings.barracks, level: 5 },
  },
  units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
}

const uplands: ProvinceMap = {
  kingdom: 1,
  province: 2,
  lastProvince: 4,
  terrain: 'uplands',
  plots: Array.from({ length: 15 }, (_, index) => ({
    plot: index + 1,
    fief: index + 1 === 5 ? { name: 'Ribalonga', isOwn: false } : null,
    camp: index + 1 === 8 ? { tier: 1, strength: 6 } : null,
    reservation: index + 1 === 9 ? { isOwn: false } : null,
  })),
}

const autumn: NonNullable<FiefOverview['season']> = {
  kind: 'autumn',
  year: 1,
  endsAt: '2026-09-25T12:00:00.000Z',
  multiplierPercent: { wood: 100, stone: 100, iron: 100, gold: 125, food: 100 },
  durationPercent: { build: 100, study: 100, train: 100, road: 75 },
}

const foundingAway: NonNullable<FiefOverview['march']> = {
  order: 'found',
  name: 'Villanueva',
  province: 2,
  plot: 7,
  terrain: 'uplands',
  units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
  stayHours: 0,
  departedAt: '2026-09-22T12:00:00.000Z',
  oneWaySeconds: 900,
  loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  arrivesAt: '2026-09-22T12:15:00.000Z',
  leavesAt: '2026-09-22T12:15:00.000Z',
  returnsAt: '2026-09-22T12:30:00.000Z',
  recalledAt: null,
  camp: null,
  fought: false,
}

const sotoverdeWithFoundingAway: FiefOverview = {
  ...sotoverdeWithASettler,
  units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
  march: foundingAway,
}

const showMap = async (
  overrides: Partial<ApiClient> = {},
  options = { isStrict: false },
): Promise<HTMLElement[]> => {
  renderAppAt(
    `${knownFiefPath}/mapa/${uplands.province}`,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: sotoverdeWithASettler }),
      provinceMap: async () => ({ ok: true, value: uplands }),
      ...overrides,
    }),
    options,
  )
  const list = await screen.findByRole('list', { name: 'Vadoalto, provincia 2' })
  await screen.findAllByRole('button', { name: /^Fundar un feudo en parcela/ })
  return within(list).getAllByRole('listitem')
}

const openFoundingOn = async (
  plot: number,
  overrides: Partial<ApiClient> = {},
  options = { isStrict: false },
): Promise<HTMLElement> => {
  await showMap(overrides, options)
  fireEvent.click(screen.getByRole('button', { name: `Fundar un feudo en parcela ${plot}` }))
  return screen.getByRole('form', { name: `Fundación en provincia 2, parcela ${plot}` })
}

const nameField = (form: HTMLElement): HTMLInputElement =>
  within(form).getByLabelText('Nombre del nuevo feudo') as HTMLInputElement

const foundButton = (form: HTMLElement): HTMLButtonElement =>
  within(form).getByRole('button', { name: /^Fundar un feudo/ }) as HTMLButtonElement

const previewOf = (form: HTMLElement): string[] =>
  within(form)
    .queryAllByRole('listitem')
    .map((line) => line.textContent ?? '')

it('offers a founding on a free plot with no camp', async () => {
  const plots = await showMap()

  const freePlot = within(plots[6] as HTMLElement)
  expect(freePlot.getByRole('button', { name: 'Enviar una marcha a parcela 7' })).toBeDefined()
  expect(freePlot.getByRole('button', { name: 'Fundar un feudo en parcela 7' })).toBeDefined()
})

it('offers no founding on a plot with a camp', async () => {
  const plots = await showMap()

  expect(
    within(plots[7] as HTMLElement).queryByRole('button', { name: /^Fundar un feudo/ }),
  ).toBeNull()
  expect(
    within(plots[4] as HTMLElement).queryByRole('button', { name: /^Fundar un feudo/ }),
  ).toBeNull()
  expect(
    within(plots[8] as HTMLElement).queryByRole('button', { name: /^Fundar un feudo/ }),
  ).toBeNull()
})

it('prefills the name of the new fief', async () => {
  const form = await openFoundingOn(7)

  expect(nameField(form).value).toBe('Sotoverde del Páramo')
  fireEvent.change(nameField(form), { target: { value: 'Villanueva' } })
  expect(nameField(form).value).toBe('Villanueva')
})

it('previews the road of the settler', async () => {
  const form = await openFoundingOn(7)

  expect(previewOf(form)).toEqual(['Camino de ida: 15:00', 'Llegada en 15:00'])
})

it('marks the road shortened in autumn', async () => {
  const form = await openFoundingOn(7, {
    fief: async () => ({ ok: true, value: { ...sotoverdeWithASettler, season: autumn } }),
  })

  expect(previewOf(form)).toEqual([
    'Camino de ida: 11:15El otoño acorta el camino',
    'Llegada en 11:15',
  ])
})

it('blocks the founding without a settler at home', async () => {
  const dispatchFounding = vi.fn(async () => ({ ok: true, value: sotoverdeWithASettler }) as const)
  const form = await openFoundingOn(7, {
    fief: async () => ({
      ok: true,
      value: {
        ...sotoverdeWithASettler,
        units: { infantry: 0, cavalry: 0, archer: 0, settler: 0 },
      },
    }),
    dispatchFounding,
  })

  fireEvent.submit(form)

  expect(screen.getByRole('article').textContent).toContain('0 colonos en casa')
  expect(foundButton(form).getAttribute('aria-label')).toBe(
    'Fundar un feudo. Necesitas 1 colono en casa y tienes 0.',
  )
  expect(dispatchFounding).not.toHaveBeenCalled()
})

it('blocks the founding while a march is away', async () => {
  const dispatchFounding = vi.fn(async () => ({ ok: true, value: sotoverdeWithASettler }) as const)
  const form = await openFoundingOn(6, {
    fief: async () => ({ ok: true, value: sotoverdeWithFoundingAway }),
    dispatchFounding,
  })

  fireEvent.submit(form)

  expect(foundButton(form).getAttribute('aria-label')).toBe(
    'Fundar un feudo. Ya hay una marcha en curso.',
  )
  expect(nameField(form).disabled).toBe(true)
  expect(dispatchFounding).not.toHaveBeenCalled()
})

it('blocks the founding with a blank name', async () => {
  const dispatchFounding = vi.fn(async () => ({ ok: true, value: sotoverdeWithASettler }) as const)
  const form = await openFoundingOn(7, { dispatchFounding })

  fireEvent.change(nameField(form), { target: { value: '   ' } })
  fireEvent.submit(form)

  expect(foundButton(form).getAttribute('aria-label')).toBe(
    'Fundar un feudo. Tu feudo necesita un nombre. Escribe uno que no esté en blanco.',
  )
  expect(previewOf(form)).toEqual([])
  expect(dispatchFounding).not.toHaveBeenCalled()
})

it('reads the cap refusal', async () => {
  const form = await openFoundingOn(7, {
    dispatchFounding: async () => ({
      ok: false,
      refusal: 'FiefCapReached',
      message: 'Solo puedes tener 3 feudos. Deja al colono en casa.',
    }),
  })

  fireEvent.click(foundButton(form))

  expect((await screen.findByRole('alert')).textContent).toBe(
    'Solo puedes tener 3 feudos. Deja al colono en casa.',
  )
})

it('reads the reserved refusal', async () => {
  const form = await openFoundingOn(7, {
    dispatchFounding: async () => ({ ok: false, refusal: 'PlotReserved' }),
  })

  fireEvent.click(foundButton(form))

  expect((await screen.findByRole('alert')).textContent).toBe(
    'Esa parcela está reservada: un colono va de camino a fundar en ella. Elige otra.',
  )
})

it('sends the founding with the name typed', async () => {
  const dispatchFounding = vi.fn(
    async (_fiefId: string, _request: DispatchFoundingRequest) =>
      ({ ok: true, value: sotoverdeWithFoundingAway }) as const,
  )
  const form = await openFoundingOn(7, { dispatchFounding }, { isStrict: true })

  fireEvent.change(nameField(form), { target: { value: '  Villanueva ' } })
  fireEvent.click(foundButton(form))

  const sent = await screen.findByRole('status')
  expect(dispatchFounding).toHaveBeenCalledTimes(1)
  expect(dispatchFounding).toHaveBeenCalledWith(knownFief.id, {
    province: 2,
    plot: 7,
    name: 'Villanueva',
  })
  expect(sent.textContent).toContain('Marcha de fundación: 1 colono a provincia 2, parcela 7')
  expect(sent.textContent).toContain('Nuevo feudo: Villanueva')
  expect(sent.textContent).toContain('Llegada en 15:00')
  expect(sent.textContent).not.toContain('Botín')
  expect(screen.queryByRole('form', { name: 'Fundación en provincia 2, parcela 7' })).toBeNull()
})

it('reads the target plot reserved once the founding is sent', async () => {
  const reservedForTheFounder: ProvinceMap = {
    ...uplands,
    plots: uplands.plots.map((plot) =>
      plot.plot === 7 ? { ...plot, reservation: { isOwn: true } } : plot,
    ),
  }
  const provinceMap = vi
    .fn<ApiClient['provinceMap']>()
    .mockResolvedValueOnce({ ok: true, value: uplands })
    .mockResolvedValue({ ok: true, value: reservedForTheFounder })
  const form = await openFoundingOn(7, {
    provinceMap,
    dispatchFounding: async () => ({ ok: true, value: sotoverdeWithFoundingAway }),
  })

  fireEvent.click(foundButton(form))
  await screen.findByRole('status')

  const list = screen.getByRole('list', { name: 'Vadoalto, provincia 2' })
  const target = within(list).getAllByRole('listitem')[6] as HTMLElement
  await waitFor(() => expect(target.textContent).toContain('Tu fundación'))
  expect(target.textContent).toContain('reservada')
  expect(within(target).queryByRole('button')).toBeNull()
  expect(screen.getByRole('status').textContent).toContain('Nuevo feudo: Villanueva')
})
