import type { DispatchTransportRequest, FiefOverview, ProvinceMap } from '@mygame/contracts'
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
import { copy } from '../copy'
import { accessibleDescriptionOf } from '../design-system/accessibleDescriptionOf.testSupport'

const otherFiefId = '4f7c1c2e-8a4b-4d1e-9f3a-2b6c8d0e1f2a'

const sotoverde: FiefOverview = {
  ...knownFief,
  name: 'Sotoverde',
  coordinates: { kingdom: 1, province: 3, plot: 12 },
  buildings: {
    ...knownFief.buildings,
    barracks: { ...knownFief.buildings.barracks, level: 3 },
  },
  units: { infantry: 12, cavalry: 6, archer: 0, settler: 1 },
}

const provinceWithPlots = (
  province: number,
  terrain: ProvinceMap['terrain'],
  fiefs: Readonly<Record<number, { readonly name: string; readonly isOwn: boolean }>>,
): ProvinceMap => ({
  kingdom: 1,
  province,
  lastProvince: 4,
  terrain,
  plots: Array.from({ length: 15 }, (_, index) => ({
    plot: index + 1,
    fief: fiefs[index + 1] ?? null,
    camp: null,
    reservation: null,
  })),
})

const uplands = provinceWithPlots(2, 'uplands', {
  5: { name: 'Ribalonga', isOwn: false },
  7: { name: 'Sotoverde del Páramo', isOwn: true },
})

const ridges = provinceWithPlots(3, 'ridges', {
  12: { name: 'Sotoverde', isOwn: true },
  13: { name: 'Hontanar', isOwn: false },
})

const autumn: NonNullable<FiefOverview['season']> = {
  kind: 'autumn',
  year: 1,
  endsAt: '2026-09-25T12:00:00.000Z',
  multiplierPercent: { wood: 100, stone: 100, iron: 100, gold: 125, food: 100 },
  durationPercent: { build: 100, study: 100, train: 100, road: 75 },
}

const sentCargo = { wood: 300, stone: 200, iron: 220, gold: 0, food: 0 }

const transportAway: NonNullable<FiefOverview['march']> = {
  order: 'transport',
  toFiefId: otherFiefId,
  cargo: sentCargo,
  province: 2,
  plot: 7,
  terrain: 'uplands',
  units: { infantry: 0, cavalry: 6, archer: 0, settler: 0 },
  stayHours: 0,
  departedAt: '2026-09-22T12:00:00.000Z',
  oneWaySeconds: 450,
  loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
  arrivesAt: '2026-09-22T12:07:30.000Z',
  leavesAt: '2026-09-22T12:07:30.000Z',
  returnsAt: '2026-09-22T12:15:00.000Z',
  recalledAt: null,
  camp: null,
  fought: false,
}

const showMapOf = async (
  province: ProvinceMap,
  overrides: Partial<ApiClient> = {},
  options = { isStrict: false },
): Promise<HTMLElement[]> => {
  renderAppAt(
    `${knownFiefPath}/mapa/${province.province}`,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fiefs: async () => ({
        ok: true,
        value: {
          fiefs: [
            {
              id: otherFiefId,
              name: 'Sotoverde del Páramo',
              coordinates: { kingdom: 1, province: 2, plot: 7 },
              freeSlots: [],
              fullStores: [],
            },
            {
              id: sotoverde.id,
              name: sotoverde.name,
              coordinates: sotoverde.coordinates,
              freeSlots: [],
              fullStores: [],
            },
          ],
        },
      }),
      fief: async () => ({ ok: true, value: sotoverde }),
      provinceMap: async () => ({ ok: true, value: province }),
      ...overrides,
    }),
    options,
  )
  const list = await screen.findByRole('list', {
    name: `Vadoalto, provincia ${province.province}`,
  })
  await screen.findAllByRole('button', { name: /^Enviar una marcha a parcela/ })
  return within(list).getAllByRole('listitem')
}

const openTransport = async (
  overrides: Partial<ApiClient> = {},
  options = { isStrict: false },
): Promise<HTMLElement> => {
  await showMapOf(uplands, overrides, options)
  fireEvent.click(await screen.findByRole('button', { name: 'Enviar un transporte a parcela 7' }))
  return screen.getByRole('form', { name: 'Transporte a provincia 2, parcela 7' })
}

const type = (form: HTMLElement, label: string, value: string): void => {
  fireEvent.change(within(form).getByLabelText(label), { target: { value } })
}

const typeSixRiders = (form: HTMLElement): void => {
  type(form, 'Infantes a enviar', '0')
  type(form, 'Jinetes a enviar', '6')
}

const loadCargo = (form: HTMLElement, wood: string, stone: string, iron: string): void => {
  type(form, 'Madera a enviar', wood)
  type(form, 'Piedra a enviar', stone)
  type(form, 'Hierro a enviar', iron)
}

const sendButton = (form: HTMLElement): HTMLButtonElement =>
  within(form).getByRole('button', { name: /^Enviar un transporte/ }) as HTMLButtonElement

const linesOf = (form: HTMLElement): string[] =>
  within(form)
    .queryAllByRole('listitem')
    .map((line) => line.textContent ?? '')

it('offers a transport on the other fief of the lord', async () => {
  const plots = await showMapOf(uplands)

  const otherFief = within(plots[6] as HTMLElement)
  expect(
    await otherFief.findByRole('button', { name: 'Enviar un transporte a parcela 7' }),
  ).toBeDefined()
  expect(otherFief.queryByRole('button', { name: /^Enviar una marcha/ })).toBeNull()
  expect(within(plots[4] as HTMLElement).queryByRole('button')).toBeNull()
})

it('offers nothing on the fief the map is read from', async () => {
  const plots = await showMapOf(ridges)

  await waitFor(() => {
    expect(within(plots[11] as HTMLElement).queryByText('Sotoverde')).not.toBeNull()
  })
  expect(within(plots[11] as HTMLElement).queryByRole('button')).toBeNull()
  expect(screen.queryByRole('button', { name: /^Enviar un transporte/ })).toBeNull()
})

it('shows the convoy art on the transport form', async () => {
  await openTransport()

  expect(screen.getByRole('presentation').getAttribute('src')).toBe('/art/convoys/convoy.png')
})

it('offers no settler field', async () => {
  const form = await openTransport()

  expect(within(form).getByLabelText('Infantes a enviar')).toBeDefined()
  expect(within(form).getByLabelText('Jinetes a enviar')).toBeDefined()
  expect(within(form).getAllByRole('spinbutton').slice(0, 3)).toEqual([
    within(form).getByLabelText('Infantes a enviar'),
    within(form).getByLabelText('Jinetes a enviar'),
    within(form).getByLabelText('Arqueros a enviar'),
  ])
  expect(within(form).queryByLabelText('Colonos a enviar')).toBeNull()
  expect(within(form).queryByLabelText('Horas de forrajeo')).toBeNull()
  for (const label of [
    'Madera a enviar',
    'Piedra a enviar',
    'Hierro a enviar',
    'Oro a enviar',
    'Comida a enviar',
  ]) {
    expect(within(form).getByLabelText(label)).toBeDefined()
  }
})

it('counts the carry as units are picked', async () => {
  const form = await openTransport()

  typeSixRiders(form)

  expect(linesOf(form)[0]).toBe('Carga: 0 de 720')
  loadCargo(form, '300', '200', '220')
  expect(linesOf(form)[0]).toBe('Carga: 720 de 720')
})

it('counts the archers in the live carry', async () => {
  const form = await openTransport({
    fief: async () => ({
      ok: true,
      value: { ...sotoverde, units: { ...sotoverde.units, archer: 10 } },
    }),
  })

  type(form, 'Infantes a enviar', '0')
  type(form, 'Arqueros a enviar', '10')

  expect(linesOf(form)[0]).toBe('Carga: 0 de 240')
  loadCargo(form, '100', '80', '60')
  expect(linesOf(form)[0]).toBe('Carga: 240 de 240')
})

it('previews the road of the slowest kind', async () => {
  const form = await openTransport()

  typeSixRiders(form)
  expect(linesOf(form).slice(1)).toEqual(['Camino de ida: 7:30', 'Llegada en 7:30'])

  type(form, 'Infantes a enviar', '12')
  expect(linesOf(form).slice(1)).toEqual(['Camino de ida: 15:00', 'Llegada en 15:00'])
})

it('marks the road shortened in autumn', async () => {
  const form = await openTransport({
    fief: async () => ({ ok: true, value: { ...sotoverde, season: autumn } }),
  })

  typeSixRiders(form)

  expect(linesOf(form).slice(1)).toEqual([
    'Camino de ida: 5:38El otoño acorta el camino',
    'Llegada en 5:38',
  ])
})

it('blocks a cargo above the carry', async () => {
  const form = await openTransport()

  typeSixRiders(form)
  loadCargo(form, '300', '200', '221')

  expect(linesOf(form)[0]).toBe('Carga: 721 de 720')
  expect(sendButton(form).getAttribute('aria-disabled')).toBe('true')
  expect(within(form).getByText('La carga suma 721 y tus hombres llevan hasta 720.')).toBeDefined()
})

it('blocks a cargo above the stocks', async () => {
  const form = await openTransport({
    fief: async () => ({
      ok: true,
      value: {
        ...sotoverde,
        resources: {
          ...sotoverde.resources,
          iron: { ...sotoverde.resources.iron, amount: 200 },
        },
      },
    }),
  })

  typeSixRiders(form)
  loadCargo(form, '300', '200', '220')

  expect(sendButton(form).getAttribute('aria-disabled')).toBe('true')
  expect(within(form).getByText('Te faltan 20 de hierro.')).toBeDefined()
})

it('blocks an empty cargo', async () => {
  const form = await openTransport()

  typeSixRiders(form)

  expect(sendButton(form).getAttribute('aria-disabled')).toBe('true')
  expect(
    within(form).getByText('Un transporte no sale de vacío. Carga al menos un recurso.'),
  ).toBeDefined()
})

it('blocks a transport with no unit', async () => {
  const form = await openTransport()

  type(form, 'Infantes a enviar', '0')
  loadCargo(form, '300', '0', '0')

  expect(linesOf(form)).toEqual(['Carga: 300 de 0'])
  expect(sendButton(form).getAttribute('aria-disabled')).toBe('true')
  expect(within(form).getByText('Envía al menos un infante, un jinete o un arquero.')).toBeDefined()
})

it('blocks a transport while a march is away', async () => {
  const form = await openTransport({
    fief: async () => ({ ok: true, value: { ...sotoverde, march: transportAway } }),
  })

  expect(sendButton(form).getAttribute('aria-disabled')).toBe('true')
  expect(within(form).getByText('Ya hay una marcha en curso.')).toBeDefined()
  expect((within(form).getByLabelText('Madera a enviar') as HTMLInputElement).disabled).toBe(true)
})

it('sends the transport with the units and amounts typed', async () => {
  const dispatchTransport = vi.fn(async (_fiefId: string, _request: DispatchTransportRequest) => ({
    ok: true as const,
    value: {
      ...sotoverde,
      readAt: transportAway.departedAt,
      march: transportAway,
    },
  }))
  const form = await openTransport({ dispatchTransport }, { isStrict: true })

  typeSixRiders(form)
  loadCargo(form, '300', '200', '220')
  fireEvent.click(sendButton(form))

  const sent = await screen.findByRole('status')
  expect(dispatchTransport).toHaveBeenCalledTimes(1)
  expect(dispatchTransport).toHaveBeenCalledWith(sotoverde.id, {
    toFiefId: otherFiefId,
    units: { infantry: 0, cavalry: 6, archer: 0, settler: 0 },
    cargo: sentCargo,
  })
  expect(sent.textContent).toContain('Marcha de transporte: 6 jinetes a provincia 2, parcela 7')
  expect(sent.textContent).toContain('Carga: 300 de madera, 200 de piedra y 220 de hierro')
  expect(sent.textContent).toContain('Llegada en 7:30')
  expect(screen.queryByRole('form', { name: 'Transporte a provincia 2, parcela 7' })).toBeNull()
})

it('reads the cargo above the carry as the server counted it', async () => {
  const form = await openTransport({
    dispatchTransport: async () => ({
      ok: false,
      refusal: 'CargoAboveCarry',
      message: 'La carga suma 721 y tus hombres llevan hasta 720. Quita carga o envía más hombres.',
    }),
  })

  typeSixRiders(form)
  loadCargo(form, '300', '200', '220')
  fireEvent.click(sendButton(form))

  expect(
    await screen.findByText(
      'La carga suma 721 y tus hombres llevan hasta 720. Quita carga o envía más hombres.',
    ),
  ).toBeDefined()
})

it('reads stocks drawn down since the read in the words of a cargo', async () => {
  const form = await openTransport({
    dispatchTransport: async () => ({
      ok: false,
      refusal: 'InsufficientResources',
      message: 'No tienes recursos suficientes para esa carga. Ajusta las cantidades.',
    }),
  })

  typeSixRiders(form)
  loadCargo(form, '300', '200', '220')
  fireEvent.click(sendButton(form))

  expect(
    await screen.findByText(
      'No tienes recursos suficientes para esa carga. Ajusta las cantidades.',
    ),
  ).toBeDefined()
})

it('reads no lista on a march form', async () => {
  const form = await openTransport({
    fief: async () => ({
      ok: true,
      value: {
        ...sotoverde,
        resources: {
          ...sotoverde.resources,
          iron: { ...sotoverde.resources.iron, amount: 200, ratePerHour: 360 },
        },
      },
    }),
  })

  typeSixRiders(form)
  loadCargo(form, '300', '200', '220')

  expect(accessibleDescriptionOf(sendButton(form))).toBe('Te faltan 20 de hierro.')
  expect(within(form).queryByText(/lista/)).toBeNull()
})

it('moves focus to the province heading when a transport is sent', async () => {
  const form = await openTransport({
    dispatchTransport: async () => ({
      ok: true,
      value: { ...sotoverde, readAt: transportAway.departedAt, march: transportAway },
    }),
  })
  typeSixRiders(form)
  loadCargo(form, '300', '200', '220')
  const button = sendButton(form)
  button.focus()

  fireEvent.click(button)

  await screen.findByRole('status')
  expect(document.activeElement).toBe(
    screen.getByRole('heading', { level: 3, name: copy.map.heading(uplands.kingdom, 2) }),
  )
})

it('keeps focus on the transport when it is refused', async () => {
  const form = await openTransport({
    dispatchTransport: async () => ({ ok: false, refusal: 'Unexpected' }),
  })
  typeSixRiders(form)
  loadCargo(form, '300', '200', '220')
  const button = sendButton(form)
  button.focus()

  fireEvent.click(button)

  await screen.findByRole('alert')
  expect(document.activeElement).toBe(button)
})
