import { act, render, screen } from '@testing-library/react'
import { Fragment, type ReactElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { numberBefore } from '../design/android/numberBefore'
import { durations } from '../design/tokens'
import { LoadingSkeleton, type LoadingSkeletonProps } from './LoadingSkeleton'
import { skeletonBlocks } from './loadingSkeleton.testSupport'

const revealMs = numberBefore('ms', durations.reveal)
const holdMs = numberBefore('ms', durations.hold)
const loadingLine = 'Reading your town'
const contentLine = 'The town itself'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

const skeletonOf = (isLoading: boolean): ReactElement => (
  <LoadingSkeleton
    isLoading={isLoading}
    line={loadingLine}
    groups={[['place-card', 'action'], ['thumbnail']]}
    Frame={Fragment}
  >
    <p>{contentLine}</p>
  </LoadingSkeleton>
)

const pass = (milliseconds: number): void => {
  act(() => {
    vi.advanceTimersByTime(milliseconds)
  })
}

it('draws the content at once when nothing is loading', () => {
  render(skeletonOf(false))

  expect(screen.getByText(contentLine)).toBeDefined()
  expect(skeletonBlocks()).toEqual([])
  expect(screen.queryByRole('status')).toBeNull()
})

it('draws no block before the reveal delay', () => {
  render(skeletonOf(true))

  pass(revealMs - 1)

  expect(skeletonBlocks()).toEqual([])
})

it('draws one block per entry once the reveal delay passes', () => {
  render(skeletonOf(true))

  pass(revealMs)

  expect(skeletonBlocks()).toHaveLength(3)
})

const columnClassesOf = (groups: LoadingSkeletonProps['groups']): ReadonlyArray<string> => {
  render(
    <LoadingSkeleton isLoading line={loadingLine} groups={groups} Frame={Fragment}>
      <p>{contentLine}</p>
    </LoadingSkeleton>,
  )
  pass(revealMs)
  const grid = skeletonBlocks()[0]?.parentElement?.parentElement
  return (grid?.className ?? '').split(' ').filter((name) => name.includes('grid-cols'))
}

it('sets two groups side by side from lg', () => {
  expect(columnClassesOf([['action'], ['thumbnail']])).toEqual(['lg:grid-cols-2'])
})

it('keeps a single group the full width of its column at lg', () => {
  expect(columnClassesOf([['action']])).toEqual([])
})

it('never draws a block when the read answers inside the reveal delay', () => {
  const { rerender } = render(skeletonOf(true))
  pass(revealMs - 1)

  rerender(skeletonOf(false))
  pass(revealMs + holdMs)

  expect(skeletonBlocks()).toEqual([])
  expect(screen.getByText(contentLine)).toBeDefined()
})

it('keeps the blocks for the minimum hold when the read answers just after they appear', () => {
  const { rerender } = render(skeletonOf(true))
  pass(revealMs)

  rerender(skeletonOf(false))
  pass(holdMs - 1)

  expect(skeletonBlocks()).toHaveLength(3)
  expect(screen.queryByText(contentLine)).toBeNull()
})

it('draws the content once the minimum hold ends', () => {
  const { rerender } = render(skeletonOf(true))
  pass(revealMs)

  rerender(skeletonOf(false))
  pass(holdMs)

  expect(skeletonBlocks()).toEqual([])
  expect(screen.getByText(contentLine)).toBeDefined()
})

it('keeps the blocks past the minimum hold while the read is still slow', () => {
  render(skeletonOf(true))

  pass(revealMs)
  pass(holdMs * 3)

  expect(skeletonBlocks()).toHaveLength(3)
  expect(screen.queryByText(contentLine)).toBeNull()
})

it('draws the content at once when a read answers after the minimum hold', () => {
  const { rerender } = render(skeletonOf(true))
  pass(revealMs)
  pass(holdMs)

  rerender(skeletonOf(false))

  expect(skeletonBlocks()).toEqual([])
  expect(screen.getByText(contentLine)).toBeDefined()
})

it('waits the reveal delay again when a later read loads', () => {
  const { rerender } = render(skeletonOf(true))
  pass(revealMs)
  pass(holdMs)
  rerender(skeletonOf(false))

  rerender(skeletonOf(true))
  pass(revealMs - 1)

  expect(skeletonBlocks()).toEqual([])
})

it('keeps the loading line in a status region from the first frame', () => {
  render(skeletonOf(true))

  expect(screen.getByRole('status').textContent).toBe(loadingLine)
})

it('keeps the loading line visually hidden', () => {
  render(skeletonOf(true))

  expect(screen.getByRole('status').className.split(' ')).toContain('sr-only')
})

it('hides the blocks from assistive technology', () => {
  render(skeletonOf(true))
  pass(revealMs)

  expect(skeletonBlocks().filter((block) => !block.closest('[aria-hidden="true"]'))).toEqual([])
})

it('draws the blocks solid on surface-sunken, never dashed', () => {
  render(skeletonOf(true))
  pass(revealMs)

  const classes = skeletonBlocks().map((block) => block.className.split(' '))
  expect(classes.filter((names) => !names.includes('bg-surface-sunken'))).toEqual([])
  expect(classes.flat().filter((name) => name.includes('dashed'))).toEqual([])
})

it('pulses only under motion-safe, never through the default animate-pulse', () => {
  render(skeletonOf(true))
  pass(revealMs)

  const motionClasses = skeletonBlocks().flatMap((block) =>
    block.className.split(' ').filter((name) => name.includes('animate-')),
  )
  expect(motionClasses).toEqual([
    'motion-safe:animate-skeleton-pulse',
    'motion-safe:animate-skeleton-pulse',
    'motion-safe:animate-skeleton-pulse',
  ])
})
