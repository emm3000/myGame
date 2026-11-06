import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { CardAction } from './CardAction'

const showWaitingPill = (keepsLabelWidth?: boolean): HTMLElement => {
  render(
    <CardAction
      type="button"
      label="Study"
      state={{ kind: 'affordable' }}
      isWaiting
      tone="quiet"
      keepsLabelWidth={keepsLabelWidth}
    />,
  )
  return screen.getByRole('button', { name: 'Study' })
}

const clockClassesOf = (pill: HTMLElement): ReadonlyArray<string> =>
  pill.querySelector('svg')?.getAttribute('class')?.split(' ') ?? []

it('draws the full clock on a waiting pill by default', () => {
  expect(clockClassesOf(showWaitingPill())).toContain('size-icon')
})

it('keeps the padding of a waiting pill by default', () => {
  expect(showWaitingPill().className.split(' ')).toContain('px-5')
})

it('draws the small clock on a pill that keeps its label width', () => {
  expect(clockClassesOf(showWaitingPill(true))).toContain('size-icon-small')
})

it('closes the gap to the clock on a pill that keeps its label width', () => {
  expect(showWaitingPill(true).className.split(' ')).toContain('gap-1')
})
