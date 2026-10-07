import type { FiefOverview } from '@mygame/contracts'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'
import { CavalryIcon } from '../design-system/icons/CavalryIcon'
import { InfantryIcon } from '../design-system/icons/InfantryIcon'
import { SettlerIcon } from '../design-system/icons/SettlerIcon'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownFief.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const barracksAt = (level: number): FiefOverview => ({
  ...knownFief,
  buildings: {
    ...knownFief.buildings,
    barracks: { ...knownFief.buildings.barracks, level },
  },
  units: { infantry: 12, cavalry: 0, archer: 0, settler: 0 },
})

const barracksAtFiveWithSettlerStocks: FiefOverview = {
  ...barracksAt(5),
  resources: {
    ...knownFief.resources,
    wood: { ...knownFief.resources.wood, amount: 1000 },
    stone: { ...knownFief.resources.stone, amount: 1000 },
    iron: { ...knownFief.resources.iron, amount: 600 },
    gold: { ...knownFief.resources.gold, amount: 100 },
    food: { ...knownFief.resources.food, amount: 1000 },
  },
  recruitTerms: {
    ...knownFief.recruitTerms,
    settler: { ...knownFief.recruitTerms.settler, perUnitSeconds: 1200 },
  },
}

const showFief = async (
  overview: FiefOverview,
  overrides: Partial<ApiClient> = {},
): Promise<void> => {
  renderAppAt(
    knownFiefPath,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: overview }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const armySection = (): HTMLElement => screen.getByRole('region', { name: copy.army.section })

const aThousand = '1\u2009000'

const settlerCard = (): HTMLElement =>
  within(armySection()).getByRole('listitem', { name: 'colonos' })

const settlerCountField = (): HTMLElement =>
  within(settlerCard()).getByRole('spinbutton', { name: 'Colonos a reclutar' })

const unitCountOf = (card: HTMLElement, text: string): HTMLElement =>
  within(card).getByText(
    (_, element) =>
      element?.textContent === text &&
      Array.from(element.children).every((child) => child.textContent !== text),
  )

const svgOf = (icon: ReactElement): string => {
  const { container, unmount } = render(icon)
  const markup = container.querySelector('svg')?.outerHTML ?? ''
  unmount()
  return markup
}

it('locks the settler card below barracks level 5 and names the level', async () => {
  await showFief(barracksAt(4))

  expect(within(settlerCard()).getByText('Requiere cuartel de nivel 5')).toBeDefined()
  expect(
    within(settlerCard()).getByText('Necesitas un cuartel de nivel 5 y el tuyo es de nivel 4.'),
  ).toBeDefined()
  expect(unitCountOf(settlerCard(), '0 colonos en casa')).toBeDefined()
  expect(within(settlerCard()).queryByRole('spinbutton')).toBeNull()
  expect(within(settlerCard()).queryByRole('button')).toBeNull()
})

it('recruits a settler at barracks level 5', async () => {
  const placeRecruitOrder = vi.fn(async () => ({
    ok: true as const,
    value: barracksAtFiveWithSettlerStocks,
  }))
  await showFief(barracksAtFiveWithSettlerStocks, { placeRecruitOrder })

  fireEvent.change(settlerCountField(), { target: { value: '1' } })
  fireEvent.click(within(settlerCard()).getByRole('button', { name: 'Reclutar colonos · 20:00' }))
  await passSeconds(0)

  expect(placeRecruitOrder).toHaveBeenCalledWith(knownFief.id, { unit: 'settler', count: 1 })
  expect(within(settlerCard()).queryByText('Requiere cuartel de nivel 5')).toBeNull()
})

it('previews one settler with its cost, peasants and duration', async () => {
  await showFief(barracksAtFiveWithSettlerStocks)

  fireEvent.change(settlerCountField(), { target: { value: '1' } })

  const costs = within(settlerCard())
    .getAllByRole('listitem')
    .map((item) => item.textContent)
  expect(costs).toEqual([
    `${aThousand} de madera`,
    `${aThousand} de piedra`,
    '600 de hierro',
    '100 de oro',
    `${aThousand} de comida`,
    '4 campesinos',
  ])
  const button = within(settlerCard()).getByRole('button')
  expect(button.textContent).toBe('Reclutar colonos · 20:00')
  expect(button.hasAttribute('disabled')).toBe(false)
})

it('draws the settler with its own icon', async () => {
  await showFief(barracksAtFiveWithSettlerStocks)

  const icons = Array.from(settlerCard().querySelectorAll('header svg')).map(
    (icon) => icon.outerHTML,
  )
  expect(icons).toEqual([svgOf(<SettlerIcon />)])
  expect(svgOf(<SettlerIcon />)).not.toBe(svgOf(<InfantryIcon />))
  expect(svgOf(<SettlerIcon />)).not.toBe(svgOf(<CavalryIcon />))
})

it('names the settlers and their level when the api refuses a settler levy below its barracks', async () => {
  const placeRecruitOrder = async () => ({ ok: false as const, refusal: 'BarracksTooLow' as const })
  await showFief(barracksAtFiveWithSettlerStocks, { placeRecruitOrder })

  fireEvent.change(settlerCountField(), { target: { value: '1' } })
  fireEvent.click(within(settlerCard()).getByRole('button'))
  await passSeconds(0)

  expect(within(armySection()).getByRole('alert').textContent).toBe(
    'Tu cuartel aún no llega al nivel 5 que piden los colonos. Mejóralo primero.',
  )
})
