import { es } from '@mygame/catalog'
import type { Placement } from '@mygame/contracts'
import { act, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'

beforeEach(() => {
  vi.useFakeTimers({ now: Date.parse(knownTown.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const showTownWith = async (placement: Placement): Promise<void> => {
  renderAppAt(
    '/',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      placement: async () => ({ ok: true, value: placement }),
    }),
  )
  await act(() => vi.advanceTimersByTimeAsync(0))
}

const askingBand: Placement = {
  kind: 'asking',
  band: 1,
  scores: [],
  items: [{ wordId: 'word-house', word: 'house', choices: [{ choiceId: 'c', gloss: 'casa' }] }],
}

it('links an offered placement from the town home', async () => {
  await showTownWith({ kind: 'offered' })

  const link = screen.getByRole('link', { name: es.placementOfferLink() })
  expect(link.getAttribute('href')).toBe('/placement')
})

it('links a placement in progress from the town home to go on with it', async () => {
  await showTownWith(askingBand)

  const link = screen.getByRole('link', { name: es.placementOfferResumeLink() })
  expect(link.getAttribute('href')).toBe('/placement')
})

it('shows no placement on the town home once it is closed', async () => {
  await showTownWith({ kind: 'closed', scores: [] })

  expect(screen.queryByRole('heading', { name: es.placementTitle() })).toBeNull()
  expect(screen.queryByRole('link', { name: es.placementOfferLink() })).toBeNull()
})
