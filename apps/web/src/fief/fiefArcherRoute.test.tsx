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
import { ArcherIcon } from '../design-system/icons/ArcherIcon'
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

const barracksAtTwo: FiefOverview = {
  ...barracksAt(2),
  recruitTerms: {
    ...knownFief.recruitTerms,
    archer: { ...knownFief.recruitTerms.archer, perUnitSeconds: 50 },
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

const archerCard = (): HTMLElement =>
  within(armySection()).getByRole('listitem', { name: 'arqueros' })

const archerCountField = (): HTMLElement =>
  within(archerCard()).getByRole('spinbutton', { name: 'Arqueros a reclutar' })

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

it('locks the archer card below barracks level 2 and names the level', async () => {
  await showFief(barracksAt(1))

  expect(within(archerCard()).getByText('Requiere cuartel de nivel 2')).toBeDefined()
  expect(
    within(archerCard()).getByText('Necesitas un cuartel de nivel 2 y el tuyo es de nivel 1.'),
  ).toBeDefined()
  expect(unitCountOf(archerCard(), '0 arqueros en casa')).toBeDefined()
})

it('offers no recruit form on a locked archer card', async () => {
  await showFief(barracksAt(1))

  expect(within(archerCard()).queryByRole('spinbutton')).toBeNull()
  expect(within(archerCard()).queryByRole('button')).toBeNull()
  expect(within(archerCard()).queryAllByRole('listitem')).toEqual([])
})

it('recruits archers at barracks level 2', async () => {
  const placeRecruitOrder = vi.fn(async () => ({ ok: true as const, value: barracksAtTwo }))
  await showFief(barracksAtTwo, { placeRecruitOrder })

  fireEvent.change(archerCountField(), { target: { value: '4' } })
  fireEvent.click(within(archerCard()).getByRole('button', { name: 'Reclutar arqueros · 3:20' }))
  await passSeconds(0)

  expect(placeRecruitOrder).toHaveBeenCalledWith(knownFief.id, { unit: 'archer', count: 4 })
  expect(within(archerCard()).queryByText('Requiere cuartel de nivel 2')).toBeNull()
})

it('previews an archer order with its cost, peasants and duration', async () => {
  await showFief(barracksAtTwo)

  fireEvent.change(archerCountField(), { target: { value: '4' } })

  const costs = within(archerCard())
    .getAllByRole('listitem')
    .map((item) => item.textContent)
  expect(costs).toEqual([
    '160 de madera',
    '40 de hierro',
    '20 de oro',
    '160 de comida',
    '4 campesinos',
  ])
  const button = within(archerCard()).getByRole('button')
  expect(button.textContent).toBe('Reclutar arqueros · 3:20')
  expect(button.hasAttribute('disabled')).toBe(false)
})

it('draws the archer with its own icon', async () => {
  await showFief(barracksAtTwo)

  const icons = Array.from(archerCard().querySelectorAll('header svg')).map(
    (icon) => icon.outerHTML,
  )
  expect(icons).toEqual([svgOf(<ArcherIcon />)])
  expect(svgOf(<ArcherIcon />)).not.toBe(svgOf(<InfantryIcon />))
  expect(svgOf(<ArcherIcon />)).not.toBe(svgOf(<CavalryIcon />))
  expect(svgOf(<ArcherIcon />)).not.toBe(svgOf(<SettlerIcon />))
})

it('shows the archer card third of the four', async () => {
  await showFief(barracksAt(1))

  const titles = within(armySection())
    .getAllByRole('heading', { level: 4 })
    .map((heading) => heading.textContent)
  expect(titles).toEqual(['Infantes', 'Jinetes', 'Arqueros', 'Colonos'])
})
