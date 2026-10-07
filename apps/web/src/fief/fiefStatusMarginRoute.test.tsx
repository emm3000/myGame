import { act, cleanup, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'
import { statusBlockHeightProperty } from '../design/tokens'
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

const isStatusBlock = (target: Element): boolean =>
  target.contains(screen.getByRole('listitem', { name: copy.names.resources.wood })) &&
  target.contains(screen.getByText(copy.status.label)) &&
  !target.contains(screen.getByRole('heading', { level: 2, name: knownFief.name }))

const scrollMargin = (): string =>
  document.documentElement.style.getPropertyValue(statusBlockHeightProperty)

it('writes the status block height as the sections scroll margin', async () => {
  await showFief()

  act(() => resizeObserver.resizeTo(isStatusBlock, 431.5))

  expect(scrollMargin()).toBe('431.5px')
})

it('updates the scroll margin when the status block grows', async () => {
  await showFief()
  act(() => resizeObserver.resizeTo(isStatusBlock, 359))

  act(() => resizeObserver.resizeTo(isStatusBlock, 512))

  expect(scrollMargin()).toBe('512px')
})

it('stops measuring the status block once the fief layout is gone', async () => {
  await showFief()
  act(() => resizeObserver.resizeTo(isStatusBlock, 431))
  const measured = { observed: resizeObserver.observedCount(), margin: scrollMargin() }

  cleanup()

  expect(measured).toEqual({ observed: 1, margin: '431px' })
  expect({ observed: resizeObserver.observedCount(), margin: scrollMargin() }).toEqual({
    observed: 0,
    margin: '',
  })
})
