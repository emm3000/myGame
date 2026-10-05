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

const fiefWithArchers: FiefOverview = {
  ...knownFief,
  coordinates: { kingdom: 1, province: 3, plot: 12 },
  units: { infantry: 12, cavalry: 6, archer: 10, settler: 0 },
}

const uplandsWithACamp: ProvinceMap = {
  kingdom: 1,
  province: 2,
  lastProvince: 3,
  terrain: 'uplands',
  plots: Array.from({ length: 15 }, (_, index) => ({
    plot: index + 1,
    fief: null,
    camp: index + 1 === 9 ? { tier: 1, strength: 6 } : null,
    reservation: null,
  })),
}

const threeKindsAway: NonNullable<FiefOverview['march']> = {
  order: 'forage',
  province: 2,
  plot: 7,
  terrain: 'uplands',
  units: { infantry: 12, cavalry: 6, archer: 10, settler: 0 },
  stayHours: 2,
  departedAt: '2026-09-22T12:00:00.000Z',
  oneWaySeconds: 900,
  loot: { wood: 168, stone: 168, iron: 0, gold: 0, food: 0 },
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
      fief: async () => ({ ok: true, value: fiefWithArchers }),
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

const openAttackOn9 = async (): Promise<HTMLElement> => {
  await showMap({})
  fireEvent.click(screen.getByRole('button', { name: 'Atacar el campamento en parcela 9' }))
  return screen.getByRole('form', { name: 'Ataque a provincia 2, parcela 9' })
}

const type = (form: HTMLElement, label: string, value: string): void => {
  fireEvent.change(within(form).getByLabelText(label), { target: { value } })
}

const typeParty = (form: HTMLElement, infantry: string, cavalry: string, archers: string): void => {
  type(form, 'Infantes a enviar', infantry)
  type(form, 'Jinetes a enviar', cavalry)
  type(form, 'Arqueros a enviar', archers)
}

const previewLine = (form: HTMLElement, heading: string): string | undefined =>
  within(form)
    .queryAllByRole('listitem')
    .map((line) => line.textContent ?? '')
    .find((line) => line.startsWith(heading))

const sendButton = (form: HTMLElement): HTMLButtonElement =>
  within(form).getByRole('button', { name: /^Enviar una marcha/ }) as HTMLButtonElement

it('offers the archer field third and no settler field', async () => {
  const form = await openMarchTo7()

  expect(within(form).getAllByRole('spinbutton')).toEqual([
    within(form).getByLabelText('Infantes a enviar'),
    within(form).getByLabelText('Jinetes a enviar'),
    within(form).getByLabelText('Arqueros a enviar'),
    within(form).getByLabelText('Horas de forrajeo'),
  ])
  const tallies = screen.getByRole('article').textContent
  expect(tallies).toMatch(/12 infantes en casa.*6 jinetes en casa.*10 arqueros en casa/)
  expect(tallies).not.toMatch(/colonos? en casa/)
  expect(within(form).queryByLabelText('Colonos a enviar')).toBeNull()

  fireEvent.click(screen.getByRole('button', { name: 'Atacar el campamento en parcela 9' }))
  const attackForm = screen.getByRole('form', { name: 'Ataque a provincia 2, parcela 9' })
  expect(within(attackForm).getAllByRole('spinbutton')).toEqual([
    within(attackForm).getByLabelText('Infantes a enviar'),
    within(attackForm).getByLabelText('Jinetes a enviar'),
    within(attackForm).getByLabelText('Arqueros a enviar'),
  ])
  expect(within(attackForm).queryByLabelText('Colonos a enviar')).toBeNull()
})

it('times archers beside riders at the archers pace', async () => {
  const form = await openMarchTo7()

  typeParty(form, '0', '6', '4')

  expect(previewLine(form, 'Camino de ida:')).toBe('Camino de ida: 15:00')
})

it('previews the forage of archers capped by their carry', async () => {
  const form = await openMarchTo7()

  typeParty(form, '0', '0', '10')
  type(form, 'Horas de forrajeo', '8')

  expect(previewLine(form, 'Botín:')).toBe('Botín: 120 de madera y 120 de piedra')
})

it('previews the archers falling last', async () => {
  const form = await openAttackOn9()

  typeParty(form, '1', '1', '4')

  expect(previewLine(form, 'Batalla:')).toBe('Batalla: ganada')
  expect(previewLine(form, 'Bajas:')).toBe('Bajas: 1 infante, 1 jinete y 3 arqueros')
  expect(previewLine(form, 'Vuelven:')).toBe('Vuelven: 1 arquero')
  expect(previewLine(form, 'Botín:')).toBe('Botín: 8 de madera, 8 de piedra y 8 de oro')
})

it('blocks more archers than are at home', async () => {
  const send = vi.fn(async () => ({ ok: true, value: fiefWithArchers }) as const)
  const form = await openMarchTo7({ dispatchMarch: send })

  typeParty(form, '12', '6', '11')
  fireEvent.submit(form)

  expect(sendButton(form).getAttribute('aria-label')).toBe(
    'Enviar una marcha. Necesitas 11 arqueros en casa y tienes 10.',
  )
  expect(send).not.toHaveBeenCalled()
})

it('sends archers and shows them sent', async () => {
  const dispatchMarch = vi.fn(
    async (_fiefId: string, _request: DispatchMarchRequest) =>
      ({ ok: true, value: { ...fiefWithArchers, march: threeKindsAway } }) as const,
  )
  const form = await openMarchTo7({ dispatchMarch })

  typeParty(form, '12', '6', '10')
  type(form, 'Horas de forrajeo', '2')
  fireEvent.click(sendButton(form))

  const sent = await screen.findByRole('status')
  expect(dispatchMarch).toHaveBeenCalledWith(knownFief.id, {
    province: 2,
    plot: 7,
    units: { infantry: 12, cavalry: 6, archer: 10, settler: 0 },
    stayHours: 2,
  })
  expect(sent.textContent).toContain(
    'Marcha de ida: 12 infantes, 6 jinetes y 10 arqueros a provincia 2, parcela 7',
  )
  expect(screen.queryByRole('form', { name: copy.march.title(2, 7) })).toBeNull()
})
