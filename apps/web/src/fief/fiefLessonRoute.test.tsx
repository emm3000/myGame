import { lessonTitle, lessonToReview, studySection } from '@mygame/catalog'
import type { FiefOverview } from '@mygame/contracts'
import { act, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownFief.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const libraryBuilt: FiefOverview = {
  ...knownFief,
  buildings: {
    ...knownFief.buildings,
    library: { ...knownFief.buildings.library, level: 1 },
  },
}

const showFief = async (overview: FiefOverview): Promise<void> => {
  renderAppAt(
    knownFiefPath,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: overview }),
    }),
  )
  await act(() => vi.advanceTimersByTimeAsync(0))
}

const lessonCard = (): HTMLElement =>
  within(screen.getByRole('region', { name: studySection() })).getByRole('listitem', {
    name: lessonTitle(),
  })

it("links the library's lesson card to the reviews with no start button", async () => {
  await showFief(libraryBuilt)

  expect(
    within(lessonCard()).getByRole('link', { name: lessonToReview() }).getAttribute('href'),
  ).toBe('/reviews')
  expect(within(lessonCard()).queryByRole('button')).toBeNull()
})
