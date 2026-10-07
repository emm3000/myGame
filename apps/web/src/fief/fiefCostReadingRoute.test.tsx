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

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownFief.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

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

const costLinesReading = (reading: string): ReadonlyArray<HTMLElement> =>
  screen.queryAllByText(
    (_, element) => element?.tagName === 'LI' && element.textContent === reading,
  )

const fiefShortOfWood: FiefOverview = {
  ...knownFief,
  resources: { ...knownFief.resources, wood: { ...knownFief.resources.wood, amount: 50 } },
}

const fiefWithNoFreePeasant: FiefOverview = {
  ...knownFief,
  peasants: { ...knownFief.peasants, free: 0, projectedFree: 0, lowestFree: 0 },
}

it('marks a short cost line with a word, not colour alone', async () => {
  await showFief(fiefShortOfWood)

  expect(costLinesReading('90 de madera, falta').length).toBeGreaterThan(0)
})

it('names the resource of a cost line the fief can pay, with no short word', async () => {
  await showFief(fiefShortOfWood)

  expect(costLinesReading('23 de piedra').length).toBeGreaterThan(0)
  expect(costLinesReading('23 de piedra, falta')).toEqual([])
})

it('marks a peasants line short of free peasants with the same word', async () => {
  await showFief(fiefWithNoFreePeasant)

  expect(costLinesReading('1 campesino, falta').length).toBeGreaterThan(0)
})

it('names the peasants of a cost line the fief can staff', async () => {
  await showFief(knownFief)

  expect(costLinesReading('1 campesino').length).toBeGreaterThan(0)
})
