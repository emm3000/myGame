import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { CardAction, type CardActionState } from './CardAction'
import type { Label } from './Label'
import { lineLabelOf } from './lineLabelOf'

const showWaitingPill = (keepsLabelWidth?: boolean): HTMLElement => {
  render(
    <CardAction
      type="button"
      label={lineLabelOf('Study', 'en')}
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
      label={lineLabelOf('Build', 'en')}
      state={state}
      isWaiting={false}
      onAction={() => pressed.push('Build')}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Build' }))
  return pressed
}

it('sends a blocked action when pressed, since the api holds the verdict', () => {
  expect(
    pressCardAction({ kind: 'blocked', reason: lineLabelOf('Need 50 more material.', 'en') }),
  ).toEqual(['Build'])
})

it('sends nothing for an entry that builds no request', () => {
  expect(
    pressCardAction({ kind: 'invalidEntry', reason: lineLabelOf('Enter a count.', 'en') }),
  ).toEqual([])
})

it('waits on a blocked action while its request is in flight', () => {
  render(
    <CardAction
      type="button"
      label={lineLabelOf('Build', 'en')}
      state={{ kind: 'blocked', reason: lineLabelOf('Need 50 more material.', 'en') }}
      isWaiting
    />,
  )

  expect(screen.getByRole('button', { name: 'Build' }).getAttribute('aria-busy')).toBe('true')
})

it('announces the reason of a marked action when it arrives', () => {
  const { rerender } = render(
    <CardAction
      type="button"
      label={lineLabelOf('Send', 'en')}
      state={{ kind: 'affordable' }}
      isWaiting={false}
      announcesReason
    />,
  )
  rerender(
    <CardAction
      type="button"
      label={lineLabelOf('Send', 'en')}
      state={{ kind: 'blocked', reason: lineLabelOf('Your team is out.', 'en') }}
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
      label={lineLabelOf('Send', 'en')}
      state={{ kind: 'blocked', reason: lineLabelOf('Your team is out.', 'en') }}
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
      label={lineLabelOf('Build', 'en')}
      state={{ kind: 'blocked', reason: lineLabelOf('Need 50 more material.', 'en') }}
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
      label={lineLabelOf('Send', 'en')}
      state={{ kind: 'invalidEntry', reason: lineLabelOf('Enter a whole count.', 'en') }}
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
      label={lineLabelOf('Send', 'en')}
      state={{ kind: 'affordable' }}
      isWaiting={false}
      announcesReason
    />,
  )

  expect(document.querySelector('[aria-live="polite"]')?.className.split(' ')).not.toContain(
    'empty:hidden',
  )
})

const buildBoth: Label = {
  text: 'Build',
  language: 'en',
  translation: { text: 'Construir', language: 'es' },
}

it('draws a both-phase label as English over Spanish, each line marked with its language', () => {
  render(
    <CardAction type="button" label={buildBoth} state={{ kind: 'affordable' }} isWaiting={false} />,
  )

  const english = screen.getByText('Build')
  const translation = screen.getByText('Construir')

  expect(english.compareDocumentPosition(translation)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  expect([english.getAttribute('lang'), translation.getAttribute('lang')]).toEqual(['en', 'es'])
})

it('describes a blocked action by both lines of its reason', () => {
  render(
    <CardAction
      type="button"
      label={buildBoth}
      state={{
        kind: 'blocked',
        reason: {
          text: 'Need more material.',
          language: 'en',
          translation: { text: 'Falta material.', language: 'es' },
        },
      }}
      isWaiting={false}
    />,
  )

  expect(
    screen.getByRole('button', {
      name: 'Build Construir',
      description: 'Need more material. Falta material.',
    }),
  ).toBeDefined()
})
