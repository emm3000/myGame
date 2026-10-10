import type { FiefOverview } from '@mygame/contracts'
import { act, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'
import { stubMatchMedia } from '../map/stubMatchMedia.testSupport'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownFief.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const neutralPercents = { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 }

const springOnTheRidges: FiefOverview = {
  ...knownFief,
  terrain: 'ridges',
  season: {
    kind: 'spring',
    year: 2,
    endsAt: '2026-09-25T17:00:00.000Z',
    multiplierPercent: neutralPercents,
    durationPercent: { build: 100, study: 100, train: 100, road: 100 },
  },
}

const showAt = async (path: string, fief: FiefOverview = knownFief): Promise<void> => {
  renderAppAt(
    path,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: fief }),
    }),
  )
  await act(() => vi.advanceTimersByTimeAsync(0))
}

const sceneBand = (): HTMLElement | null => document.querySelector('[data-terrain]')

const resourceBar = (): HTMLElement =>
  screen.getByRole('listitem', { name: copy.names.resources.wood })

const isBefore = (first: Node, second: Node): boolean =>
  (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

it('draws the scene of the fief terrain in the fief header', async () => {
  stubMatchMedia(true)
  await showAt(knownFiefPath, springOnTheRidges)

  const band = sceneBand()
  expect(band?.closest('header')).not.toBeNull()
  expect(band?.dataset.terrain).toBe('ridges')
  expect(band?.dataset.season).toBe('spring')
})

it('draws the scene with no season before the first spring', async () => {
  stubMatchMedia(true)
  await showAt(knownFiefPath)

  expect(sceneBand()?.dataset.season).toBe('none')
})

it('keeps the scene band under the sticky resource bar from md', async () => {
  stubMatchMedia(true)
  await showAt(knownFiefPath)

  const band = sceneBand()
  expect(band).not.toBeNull()
  expect(band !== null && isBefore(resourceBar(), band)).toBe(true)
})

it('opens the phone screen on the scene band above the resource bar', async () => {
  stubMatchMedia(false)
  await showAt(knownFiefPath)

  const band = sceneBand()
  expect(band).not.toBeNull()
  expect(band !== null && isBefore(band, resourceBar())).toBe(true)
  expect(document.querySelectorAll('[data-terrain]')).toHaveLength(1)
})

it('moves the scene band under the resource bar when the screen widens to md', async () => {
  const media = stubMatchMedia(false)
  await showAt(knownFiefPath)

  act(() => media.matchAll(true))

  const band = sceneBand()
  expect(band?.closest('header')).not.toBeNull()
  expect(document.querySelectorAll('[data-terrain]')).toHaveLength(1)
})

it('draws no scene band on the map below md', async () => {
  stubMatchMedia(false)
  await showAt(`${knownFiefPath}/mapa`)

  expect(resourceBar()).not.toBeNull()
  expect(sceneBand()).toBeNull()
})
