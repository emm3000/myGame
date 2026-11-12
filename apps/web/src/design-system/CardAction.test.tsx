import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { CardAction, type CardActionState } from './CardAction'

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

it('keeps the gap to the clock of a waiting pill by default', () => {
  expect(showWaitingPill().className.split(' ')).toContain('gap-2')
})

it('draws the small clock on a pill that keeps its label width', () => {
  expect(clockClassesOf(showWaitingPill(true))).toContain('size-icon-small')
})

it('closes the gap to the clock on a pill that keeps its label width', () => {
  expect(showWaitingPill(true).className.split(' ')).toContain('gap-1')
})

const pressCardAction = (state: CardActionState): ReadonlyArray<string> => {
  const pressed: Array<string> = []
  render(
    <CardAction
      type="button"
      label="Build"
      state={state}
      isWaiting={false}
      onAction={() => pressed.push('Build')}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Build' }))
  return pressed
}

it('sends a blocked action when pressed, since the api holds the verdict', () => {
  expect(pressCardAction({ kind: 'blocked', reason: 'Need 50 more material.' })).toEqual(['Build'])
})

it('sends nothing for an entry that builds no request', () => {
  expect(pressCardAction({ kind: 'invalidEntry', reason: 'Enter a count.' })).toEqual([])
})

it('waits on a blocked action while its request is in flight', () => {
  render(
    <CardAction
      type="button"
      label="Build"
      state={{ kind: 'blocked', reason: 'Need 50 more material.' }}
      isWaiting
    />,
  )

  expect(screen.getByRole('button', { name: 'Build' }).getAttribute('aria-busy')).toBe('true')
})

it('announces the reason of a marked action when it arrives', () => {
  const { rerender } = render(
    <CardAction
      type="button"
      label="Send"
      state={{ kind: 'affordable' }}
      isWaiting={false}
      announcesReason
    />,
  )
  rerender(
    <CardAction
      type="button"
      label="Send"
      state={{ kind: 'blocked', reason: 'Your team is out.' }}
      isWaiting={false}
      announcesReason
    />,
  )

  const live = document.querySelector('[aria-live="polite"]')
  expect(live?.textContent).toBe('Your team is out.')
})

it('keeps an announced reason as the description of its action', () => {
  render(
    <CardAction
      type="button"
      label="Send"
      state={{ kind: 'blocked', reason: 'Your team is out.' }}
      isWaiting={false}
      announcesReason
    />,
  )

  expect(
    screen.getByRole('button', { name: 'Send', description: 'Your team is out.' }),
  ).toBeDefined()
})

it('draws a blocked action with the dashed border of the mark', () => {
  render(
    <CardAction
      type="button"
      label="Build"
      state={{ kind: 'blocked', reason: 'Need 50 more material.' }}
      isWaiting={false}
    />,
  )

  expect(screen.getByRole('button', { name: 'Build' }).className.split(' ')).toContain(
    'border-dashed',
  )
})

it('keeps the reason of an entry that builds no request out of the announcement', () => {
  render(
    <CardAction
      type="button"
      label="Send"
      state={{ kind: 'invalidEntry', reason: 'Enter a whole count.' }}
      isWaiting={false}
      announcesReason
    />,
  )

  expect(document.querySelector('[aria-live="polite"]')?.textContent).toBe('')
  expect(
    screen.getByRole('button', { name: 'Send', description: 'Enter a whole count.' }),
  ).toBeDefined()
})

it('keeps an empty announcement in the accessibility tree', () => {
  render(
    <CardAction
      type="button"
      label="Send"
      state={{ kind: 'affordable' }}
      isWaiting={false}
      announcesReason
    />,
  )

  expect(document.querySelector('[aria-live="polite"]')?.className.split(' ')).not.toContain(
    'empty:hidden',
  )
})
