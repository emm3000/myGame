import { en } from '@mygame/catalog'
import type { Reviews, TownOverview } from '@mygame/contracts'
import { act } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { finishSeparator } from '../time/finishSeparator'
import { formatTimeLeft } from '../time/formatTimeLeft'
import { shownLinesDrawnAlone } from '../town/lineDrawnAlone.testSupport'

const readAt = Date.parse(knownTown.readAt)

beforeEach(() => {
  vi.useFakeTimers({ now: readAt })
})

afterEach(() => {
  vi.useRealTimers()
})

const noScaffold: Pick<TownOverview, 'scaffold' | 'chromePhase'> = {
  scaffold: 'none',
  chromePhase: 'english',
}

const nothingDueTillTomorrow: Reviews = {
  due: [],
  readFirst: [],
  nextDueAt: new Date(readAt + 86_400_000).toISOString(),
  readAt: knownTown.readAt,
}

it('counts down to the next review in English under none', async () => {
  renderAppAt(
    '/reviews',
    stubApiClient({
      currentPlayer: async () => ({ ...knownPlayer, ...noScaffold }),
      town: async () => ({ ok: true, value: { ...knownTown, ...noScaffold, nextDueAt: null } }),
      reviews: async () => ({ ok: true, value: nothingDueTillTomorrow }),
    }),
  )
  await act(() => vi.advanceTimersByTimeAsync(0))

  const nextReview = `${formatTimeLeft(86_400)} ${finishSeparator} ${en.statusTomorrow({ time: '10:00' })}`

  expect(shownLinesDrawnAlone(nextReview, 'en')).not.toHaveLength(0)
})
