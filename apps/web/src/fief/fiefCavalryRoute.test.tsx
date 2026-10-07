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

const barracksAtThree: FiefOverview = {
  ...barracksAt(3),
  recruitTerms: {
    ...knownFief.recruitTerms,
    cavalry: { ...knownFief.recruitTerms.cavalry, perUnitSeconds: 75 },
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

const unitCard = (plural: string): HTMLElement =>
  within(armySection()).getByRole('listitem', { name: plural })

const infantryCard = (): HTMLElement => unitCard('infantes')

const riderCard = (): HTMLElement => unitCard('jinetes')

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

const iconsIn = (card: HTMLElement): ReadonlyArray<string> =>
  Array.from(card.querySelectorAll('header svg')).map((icon) => icon.outerHTML)

it('shows a card per unit kind', async () => {
  await showFief(barracksAt(1))

  const titles = within(armySection())
    .getAllByRole('heading', { level: 4 })
    .map((heading) => heading.textContent)
  expect(titles).toEqual(['Infantes', 'Jinetes', 'Arqueros', 'Colonos'])
})

it('draws each kind with its own icon', async () => {
  await showFief(barracksAt(3))

  expect(iconsIn(infantryCard())).toEqual([svgOf(<InfantryIcon />)])
  expect(iconsIn(riderCard())).toEqual([svgOf(<CavalryIcon />)])
  expect(svgOf(<CavalryIcon />)).not.toBe(svgOf(<InfantryIcon />))
})

it('locks the rider card below barracks level 3 and names the level', async () => {
  await showFief(barracksAt(1))

  expect(within(riderCard()).getByText('Requiere cuartel de nivel 3')).toBeDefined()
  expect(
    within(riderCard()).getByText('Necesitas un cuartel de nivel 3 y el tuyo es de nivel 1.'),
  ).toBeDefined()
  expect(unitCountOf(riderCard(), '0 jinetes en casa')).toBeDefined()
})

it('offers no recruit form on a locked card', async () => {
  await showFief(barracksAt(2))

  expect(within(riderCard()).queryByRole('spinbutton')).toBeNull()
  expect(within(riderCard()).queryByRole('button')).toBeNull()
  expect(within(riderCard()).queryAllByRole('listitem')).toEqual([])
})

it('names the built barracks level in the lock reason', async () => {
  await showFief(barracksAt(2))

  expect(
    within(riderCard()).getByText('Necesitas un cuartel de nivel 3 y el tuyo es de nivel 2.'),
  ).toBeDefined()
})

it('keeps the infantry form open beside a locked rider card', async () => {
  await showFief(barracksAt(1))

  expect(
    within(infantryCard()).getByRole('spinbutton', { name: 'Infantes a reclutar' }),
  ).toBeDefined()
  expect(within(infantryCard()).getByRole('button').textContent).toBe('Reclutar infantes · 1:30')
})

const riderCountField = (): HTMLElement =>
  within(riderCard()).getByRole('spinbutton', { name: 'Jinetes a reclutar' })

it('recruits riders at barracks level 3', async () => {
  const placeRecruitOrder = vi.fn(async () => ({ ok: true as const, value: barracksAtThree }))
  await showFief(barracksAtThree, { placeRecruitOrder })

  fireEvent.change(riderCountField(), { target: { value: '2' } })
  fireEvent.click(within(riderCard()).getByRole('button', { name: 'Reclutar jinetes · 2:30' }))
  await passSeconds(0)

  expect(placeRecruitOrder).toHaveBeenCalledWith(knownFief.id, { unit: 'cavalry', count: 2 })
  expect(within(riderCard()).queryByText('Requiere cuartel de nivel 3')).toBeNull()
})

it('previews a rider order with its cost, peasants and duration', async () => {
  await showFief(barracksAtThree)

  fireEvent.change(riderCountField(), { target: { value: '4' } })

  const costs = within(riderCard())
    .getAllByRole('listitem')
    .map((item) => item.textContent)
  expect(costs).toEqual([
    '120 de madera',
    '160 de hierro',
    '80 de oro',
    '320 de comida',
    '8 campesinos',
  ])
  const button = within(riderCard()).getByRole('button')
  expect(button.textContent).toBe('Reclutar jinetes · 5:00')
  expect(button.hasAttribute('disabled')).toBe(false)
})

it('names the riders and their level when the api refuses a rider levy below its barracks', async () => {
  const placeRecruitOrder = async () => ({ ok: false as const, refusal: 'BarracksTooLow' as const })
  await showFief(barracksAtThree, { placeRecruitOrder })

  fireEvent.change(riderCountField(), { target: { value: '1' } })
  fireEvent.click(within(riderCard()).getByRole('button'))
  await passSeconds(0)

  expect(within(armySection()).getByRole('alert').textContent).toBe(
    'Tu cuartel aún no llega al nivel 3 que piden los jinetes. Mejóralo primero.',
  )
})
