import type { FiefOverview, ProvinceMap, SeasonKind } from '@mygame/contracts'
import { fireEvent, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'
import type { PlotCamp } from './marchFormOf'

const neutralPercents = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const neutralDurations = { build: 100, study: 100, train: 100, road: 100 }

const seasons: Readonly<Record<SeasonKind, NonNullable<FiefOverview['season']>>> = {
  spring: {
    kind: 'spring',
    year: 1,
    endsAt: '2026-09-25T12:00:00.000Z',
    multiplierPercent: { ...neutralPercents, food: 125 },
    durationPercent: { ...neutralDurations, train: 75 },
  },
  summer: {
    kind: 'summer',
    year: 1,
    endsAt: '2026-09-25T12:00:00.000Z',
    multiplierPercent: neutralPercents,
    durationPercent: { ...neutralDurations, build: 75 },
  },
  autumn: {
    kind: 'autumn',
    year: 1,
    endsAt: '2026-09-25T12:00:00.000Z',
    multiplierPercent: { ...neutralPercents, gold: 125 },
    durationPercent: { ...neutralDurations, road: 75 },
  },
  winter: {
    kind: 'winter',
    year: 1,
    endsAt: '2026-09-25T12:00:00.000Z',
    multiplierPercent: { ...neutralPercents, food: 75 },
    durationPercent: { ...neutralDurations, study: 75 },
  },
}

const fiefIn = (
  season: FiefOverview['season'],
  units: FiefOverview['units'] = { infantry: 12, cavalry: 6, archer: 0, settler: 0 },
): FiefOverview => ({ ...knownFief, season, units })

const provinceOf = (
  province: number,
  terrain: ProvinceMap['terrain'],
  camps: Readonly<Record<number, PlotCamp>> = {},
): ProvinceMap => ({
  kingdom: 1,
  province,
  lastProvince: 4,
  terrain,
  plots: Array.from({ length: 15 }, (_, index) => ({
    plot: index + 1,
    fief: null,
    camp: camps[index + 1] ?? null,
    reservation: null,
  })),
})

const lowlands = provinceOf(4, 'lowlands')

const uplands = provinceOf(2, 'uplands')

const uplandsWithCamp = provinceOf(2, 'uplands', { 7: { tier: 1, strength: 6 } })

const showMap = async (map: ProvinceMap, fief: FiefOverview): Promise<void> => {
  renderAppAt(
    `${knownFiefPath}/mapa/${map.province}`,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: fief }),
      provinceMap: async () => ({ ok: true, value: map }),
    }),
  )
  await screen.findByRole('list', { name: copy.map.heading(map.kingdom, map.province) })
  await screen.findAllByRole('button', { name: /^(Enviar una marcha|Atacar el campamento)/ })
}

const openMarchTo = async (
  map: ProvinceMap,
  plot: number,
  fief: FiefOverview,
): Promise<HTMLElement> => {
  await showMap(map, fief)
  fireEvent.click(screen.getByRole('button', { name: `Enviar una marcha a parcela ${plot}` }))
  return screen.getByRole('form', { name: `Marcha a provincia ${map.province}, parcela ${plot}` })
}

const openAttackOn = async (
  map: ProvinceMap,
  plot: number,
  fief: FiefOverview,
): Promise<HTMLElement> => {
  await showMap(map, fief)
  fireEvent.click(screen.getByRole('button', { name: `Atacar el campamento en parcela ${plot}` }))
  return screen.getByRole('form', { name: `Ataque a provincia ${map.province}, parcela ${plot}` })
}

const type = (form: HTMLElement, label: string, value: string): void => {
  fireEvent.change(within(form).getByLabelText(label), { target: { value } })
}

const sendParty = (form: HTMLElement, infantry: string, cavalry: string): void => {
  type(form, 'Infantes a enviar', infantry)
  type(form, 'Jinetes a enviar', cavalry)
}

const lineOf = (form: HTMLElement, heading: string): HTMLElement => {
  const line = within(form)
    .queryAllByRole('listitem')
    .find((item) => item.textContent?.startsWith(heading))
  if (line === undefined) {
    throw new Error(`no preview line ${heading}`)
  }
  return line
}

const roadMark = 'El otoño acorta el camino'

it('shortens the road in autumn and marks it', async () => {
  const form = await openMarchTo(lowlands, 12, fiefIn(seasons.autumn))

  sendParty(form, '12', '0')
  type(form, 'Horas de forrajeo', '2')

  expect(lineOf(form, 'Camino de ida:').textContent).toBe(`Camino de ida: 7:30${roadMark}`)
  expect(lineOf(form, 'Vuelta en').textContent).toBe('Vuelta en 2 h 15 min')

  sendParty(form, '0', '6')

  expect(lineOf(form, 'Camino de ida:').textContent).toBe(`Camino de ida: 3:45${roadMark}`)
})

it('marks no road when its percent is 100', async () => {
  const form = await openMarchTo(lowlands, 12, fiefIn(seasons.spring))

  sendParty(form, '12', '0')

  expect(lineOf(form, 'Camino de ida:').textContent).toBe('Camino de ida: 10:00')
  expect(within(form).queryByText(roadMark)).toBeNull()
})

it('raises the food of a lowlands forage in spring and marks it', async () => {
  const form = await openMarchTo(lowlands, 12, fiefIn(seasons.spring))

  sendParty(form, '12', '0')
  type(form, 'Horas de forrajeo', '2')

  expect(lineOf(form, 'Botín:').textContent).toBe(
    'Botín: 72 de madera y 90 de comidaPrimavera: +25 % de comida',
  )
})

it('lowers the food of a lowlands forage in winter and marks it', async () => {
  const form = await openMarchTo(lowlands, 12, fiefIn(seasons.winter))

  sendParty(form, '12', '0')
  type(form, 'Horas de forrajeo', '2')

  expect(lineOf(form, 'Botín:').textContent).toBe(
    'Botín: 72 de madera y 54 de comidaInvierno: -25 % de comida',
  )
})

it('marks no loot the terrain does not yield', async () => {
  const form = await openMarchTo(uplands, 7, fiefIn(seasons.spring))

  sendParty(form, '12', '0')
  type(form, 'Horas de forrajeo', '2')

  expect(lineOf(form, 'Botín:').textContent).toBe('Botín: 72 de madera y 72 de piedra')
  expect(within(form).queryByText(/ % de /)).toBeNull()
})

it('caps the scaled forage at the carry share', async () => {
  const form = await openMarchTo(lowlands, 12, fiefIn(seasons.spring))

  sendParty(form, '10', '0')
  type(form, 'Horas de forrajeo', '8')

  expect(lineOf(form, 'Botín:').textContent).toBe(
    'Botín: 240 de madera y 240 de comidaPrimavera: +25 % de comida',
  )
})

it('shortens the attack road and keeps its loot', async () => {
  const form = await openAttackOn(
    uplandsWithCamp,
    7,
    fiefIn(seasons.autumn, { infantry: 10, cavalry: 0, archer: 0, settler: 0 }),
  )

  type(form, 'Infantes a enviar', '10')

  expect(lineOf(form, 'Camino de ida:').textContent).toBe(`Camino de ida: 11:15${roadMark}`)
  expect(lineOf(form, 'Vuelta en').textContent).toBe('Vuelta en 22:30')
  expect(lineOf(form, 'Bajas:').textContent).toBe('Bajas: 4 infantes')
  expect(lineOf(form, 'Botín:').textContent).toBe('Botín: 96 de madera, 96 de piedra y 96 de oro')
})

it('marks nothing before the calendar starts', async () => {
  const march = await openMarchTo(lowlands, 12, fiefIn(null))

  sendParty(march, '12', '0')
  type(march, 'Horas de forrajeo', '2')

  expect(lineOf(march, 'Camino de ida:').textContent).toBe('Camino de ida: 10:00')
  expect(lineOf(march, 'Botín:').textContent).toBe('Botín: 72 de madera y 72 de comida')
  expect(within(march).queryByText(/acorta|%/)).toBeNull()
})

it('sets the province grid on the scene of its terrain', async () => {
  await showMap(uplands, fiefIn(seasons.autumn))
  const band = document.querySelector('[data-terrain]')

  expect([band?.getAttribute('data-terrain'), band?.getAttribute('data-season')]).toEqual([
    'uplands',
    'autumn',
  ])
  expect(band?.textContent).toBe('')
})

it('sets the grid of a province on its own terrain, not the fief one', async () => {
  await showMap(lowlands, fiefIn(null))

  expect(document.querySelector('[data-terrain]')?.getAttribute('data-terrain')).toBe('lowlands')
})

it('sets the grid of a province on a scene with no season before the first spring', async () => {
  await showMap(lowlands, fiefIn(null))

  expect(document.querySelector('[data-terrain]')?.getAttribute('data-season')).toBe('none')
})
