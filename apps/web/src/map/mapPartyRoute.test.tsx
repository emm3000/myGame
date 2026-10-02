import type { DispatchMarchRequest, FiefOverview, ProvinceMap } from '@mygame/contracts'
import { fireEvent, screen, within } from '@testing-library/react'
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

const fiefWithAParty: FiefOverview = {
  ...knownFief,
  coordinates: { kingdom: 1, province: 3, plot: 12 },
  units: { infantry: 12, cavalry: 10, settler: 0 },
}

const uplandsWithACamp: ProvinceMap = {
  kingdom: 1,
  province: 2,
  lastProvince: 3,
  terrain: 'uplands',
  plots: Array.from({ length: 15 }, (_, index) => ({
    plot: index + 1,
    fief: null,
    camp: index + 1 === 9 ? { tier: 2, strength: 15 } : null,
    reservation: null,
  })),
}

const mixedMarchAway: NonNullable<FiefOverview['march']> = {
  order: 'forage',
  province: 2,
  plot: 7,
  terrain: 'uplands',
  units: { infantry: 12, cavalry: 6, settler: 0 },
  stayHours: 2,
  departedAt: '2026-09-22T12:00:00.000Z',
  oneWaySeconds: 900,
  loot: { wood: 108, stone: 108, iron: 0, gold: 0, food: 0 },
  arrivesAt: '2026-09-22T12:15:00.000Z',
  leavesAt: '2026-09-22T14:15:00.000Z',
  returnsAt: '2026-09-22T14:30:00.000Z',
  recalledAt: null,
  camp: null,
  fought: false,
}

const showMap = async (overrides: Partial<ApiClient>): Promise<void> => {
  renderAppAt(
    `${knownFiefPath}/mapa/${uplandsWithACamp.province}`,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: fiefWithAParty }),
      provinceMap: async () => ({ ok: true, value: uplandsWithACamp }),
      ...overrides,
    }),
  )
  await screen.findAllByRole('button', { name: /^Enviar una marcha a parcela/ })
}

const openMarchTo7 = async (overrides: Partial<ApiClient> = {}): Promise<HTMLElement> => {
  await showMap(overrides)
  fireEvent.click(screen.getByRole('button', { name: 'Enviar una marcha a parcela 7' }))
  return screen.getByRole('form', { name: 'Marcha a provincia 2, parcela 7' })
}

const openAttackOn9 = async (overrides: Partial<ApiClient> = {}): Promise<HTMLElement> => {
  await showMap(overrides)
  fireEvent.click(screen.getByRole('button', { name: 'Atacar el campamento en parcela 9' }))
  return screen.getByRole('form', { name: 'Ataque a provincia 2, parcela 9' })
}

const type = (form: HTMLElement, label: string, value: string): void => {
  fireEvent.change(within(form).getByLabelText(label), { target: { value } })
}

const typeParty = (form: HTMLElement, infantry: string, cavalry: string): void => {
  type(form, 'Infantes a enviar', infantry)
  type(form, 'Jinetes a enviar', cavalry)
}

const previewLine = (form: HTMLElement, heading: string): string | undefined =>
  within(form)
    .queryAllByRole('listitem')
    .map((line) => line.textContent ?? '')
    .find((line) => line.startsWith(heading))

const sendButton = (form: HTMLElement): HTMLButtonElement =>
  within(form).getByRole('button', { name: /^Enviar una marcha/ }) as HTMLButtonElement

const entryOf = (form: HTMLElement, label: string): string =>
  (within(form).getByLabelText(label) as HTMLInputElement).value

it('opens with one rider when riders alone are at home', async () => {
  const form = await openMarchTo7({
    fief: async () => ({
      ok: true,
      value: { ...fiefWithAParty, units: { infantry: 0, cavalry: 4, settler: 0 } },
    }),
  })

  expect(entryOf(form, 'Jinetes a enviar')).toBe('1')
  expect(entryOf(form, 'Infantes a enviar')).toBe('0')
})

it('opens with one infantry and blocked when nobody is at home', async () => {
  const form = await openMarchTo7({
    fief: async () => ({
      ok: true,
      value: { ...fiefWithAParty, units: { infantry: 0, cavalry: 0, settler: 0 } },
    }),
  })

  expect(entryOf(form, 'Infantes a enviar')).toBe('1')
  expect(entryOf(form, 'Jinetes a enviar')).toBe('0')
  expect(sendButton(form).getAttribute('aria-label')).toBe(
    'Enviar una marcha. Necesitas 1 infante en casa y tienes 0.',
  )
})

it('times a march of riders alone at half the road', async () => {
  const form = await openMarchTo7()

  typeParty(form, '0', '6')

  expect(previewLine(form, 'Camino de ida:')).toBe('Camino de ida: 7:30')
})

it('times a mixed march by the slowest kind', async () => {
  const form = await openMarchTo7()

  typeParty(form, '1', '6')

  expect(previewLine(form, 'Camino de ida:')).toBe('Camino de ida: 15:00')
})

it('previews the forage of a mixed party', async () => {
  const form = await openMarchTo7()

  typeParty(form, '12', '6')
  type(form, 'Horas de forrajeo', '2')

  expect(previewLine(form, 'Vuelta en')).toBe('Vuelta en 2 h 30 min')
  expect(previewLine(form, 'Botín:')).toBe('Botín: 108 de madera y 108 de piedra')
})

it('previews the infantry falling first', async () => {
  const form = await openAttackOn9()

  typeParty(form, '12', '6')

  expect(previewLine(form, 'Batalla:')).toBe('Batalla: ganada')
  expect(previewLine(form, 'Bajas:')).toBe('Bajas: 10 infantes')
  expect(previewLine(form, 'Vuelven:')).toBe('Vuelven: 2 infantes y 6 jinetes')
  expect(previewLine(form, 'Botín:')).toBe('Botín: 272 de madera, 272 de piedra y 272 de oro')
})

it('previews the last rider kept', async () => {
  const form = await openAttackOn9()

  typeParty(form, '0', '8')

  expect(previewLine(form, 'Batalla:')).toBe('Batalla: ganada')
  expect(previewLine(form, 'Bajas:')).toBe('Bajas: 7 jinetes')
  expect(previewLine(form, 'Vuelven:')).toBe('Vuelven: 1 jinete')
})

it('blocks a march with every count at 0', async () => {
  const send = vi.fn(async () => ({ ok: true, value: fiefWithAParty }) as const)
  const form = await openMarchTo7({ dispatchMarch: send })

  typeParty(form, '0', '')
  fireEvent.submit(form)

  expect(sendButton(form).disabled).toBe(true)
  expect(sendButton(form).getAttribute('aria-label')).toBe(
    'Enviar una marcha. Envía al menos un infante o un jinete.',
  )
  expect(previewLine(form, 'Camino de ida:')).toBeUndefined()
  expect(send).not.toHaveBeenCalled()
})

it('blocks more riders than are at home', async () => {
  const send = vi.fn(async () => ({ ok: true, value: fiefWithAParty }) as const)
  const form = await openMarchTo7({ dispatchMarch: send })

  typeParty(form, '12', '11')
  fireEvent.submit(form)

  expect(sendButton(form).getAttribute('aria-label')).toBe(
    'Enviar una marcha. Necesitas 11 jinetes en casa y tienes 10.',
  )
  expect(send).not.toHaveBeenCalled()
})

it('sends both counts and shows them sent', async () => {
  const dispatchMarch = vi.fn(
    async (_fiefId: string, _request: DispatchMarchRequest) =>
      ({ ok: true, value: { ...fiefWithAParty, march: mixedMarchAway } }) as const,
  )
  const form = await openMarchTo7({ dispatchMarch })

  typeParty(form, '12', '6')
  type(form, 'Horas de forrajeo', '2')
  fireEvent.click(sendButton(form))

  const sent = await screen.findByRole('status')
  expect(dispatchMarch).toHaveBeenCalledWith(knownFief.id, {
    province: 2,
    plot: 7,
    units: { infantry: 12, cavalry: 6, settler: 0 },
    stayHours: 2,
  })
  expect(sent.textContent).toContain(
    'Marcha de ida: 12 infantes y 6 jinetes a provincia 2, parcela 7',
  )
  expect(screen.queryByRole('form', { name: copy.march.title(2, 7) })).toBeNull()
})

const fiefWithASettler = async () =>
  ({
    ok: true,
    value: { ...fiefWithAParty, units: { infantry: 12, cavalry: 10, settler: 1 } },
  }) as const

const settlerTalliesIn = (form: HTMLElement): ReadonlyArray<string> =>
  within(form)
    .queryAllByText(/colonos? en casa/)
    .map((tally) => tally.textContent ?? '')

it('offers no settler field on the forage form', async () => {
  const form = await openMarchTo7({ fief: fiefWithASettler })

  expect(within(form).queryByLabelText('Colonos a enviar')).toBeNull()
  expect(within(form).getAllByRole('spinbutton')).toEqual([
    within(form).getByLabelText('Infantes a enviar'),
    within(form).getByLabelText('Jinetes a enviar'),
    within(form).getByLabelText('Horas de forrajeo'),
  ])
  expect(settlerTalliesIn(form)).toEqual([])
})

it('offers no settler field on the attack form', async () => {
  const form = await openAttackOn9({ fief: fiefWithASettler })

  expect(within(form).queryByLabelText('Colonos a enviar')).toBeNull()
  expect(within(form).getAllByRole('spinbutton')).toEqual([
    within(form).getByLabelText('Infantes a enviar'),
    within(form).getByLabelText('Jinetes a enviar'),
  ])
  expect(settlerTalliesIn(form)).toEqual([])
})

it('sends no settler on a forage', async () => {
  const dispatchMarch = vi.fn(
    async (_fiefId: string, _request: DispatchMarchRequest) =>
      ({ ok: true, value: { ...fiefWithAParty, march: mixedMarchAway } }) as const,
  )
  const form = await openMarchTo7({ fief: fiefWithASettler, dispatchMarch })

  typeParty(form, '0', '0')

  expect(sendButton(form).getAttribute('aria-label')).toBe(
    'Enviar una marcha. Envía al menos un infante o un jinete.',
  )
  typeParty(form, '12', '6')
  type(form, 'Horas de forrajeo', '2')
  fireEvent.click(sendButton(form))

  expect(dispatchMarch).toHaveBeenCalledWith(knownFief.id, {
    province: 2,
    plot: 7,
    units: { infantry: 12, cavalry: 6, settler: 0 },
    stayHours: 2,
  })
})
