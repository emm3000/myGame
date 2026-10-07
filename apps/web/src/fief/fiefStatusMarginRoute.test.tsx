import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { statusBlockHeight } from '../design/tokens'
import { type ResizeObserverStub, stubResizeObserver } from './stubResizeObserver.testSupport'

let resizeObserver: ResizeObserverStub

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownFief.readAt) })
  resizeObserver = stubResizeObserver()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const showFief = async (): Promise<void> => {
  renderAppAt(knownFiefPath, stubApiClient({ currentPlayer: async () => knownPlayer }))
  await act(() => vi.advanceTimersByTimeAsync(0))
}

const scrollMargin = (): string =>
  document.documentElement.style.getPropertyValue(statusBlockHeight)

it('writes the status block height as the sections scroll margin', async () => {
  await showFief()

  act(() => resizeObserver.resizeTo(431.5))

  expect(scrollMargin()).toBe('431.5px')
})

it('updates the scroll margin when the status block grows', async () => {
  await showFief()
  act(() => resizeObserver.resizeTo(359))

  act(() => resizeObserver.resizeTo(512))

  expect(scrollMargin()).toBe('512px')
})

it('stops measuring the status block once the fief layout is gone', async () => {
  await showFief()
  act(() => resizeObserver.resizeTo(431))
  const measured = { observed: resizeObserver.observedCount(), margin: scrollMargin() }

  cleanup()

  expect(measured).toEqual({ observed: 1, margin: '431px' })
  expect({ observed: resizeObserver.observedCount(), margin: scrollMargin() }).toEqual({
    observed: 0,
    margin: '',
  })
})
