import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { type ActionTone, Button, type ButtonAvailability } from './Button'
import type { Label } from './Label'
import { lineLabelOf } from './lineLabelOf'

it('never fires the action of a blocked button when pressed', () => {
  const onClick = vi.fn()
  render(
    <Button type="button" tone="primary" availability="blocked" onClick={onClick}>
      Upgrade
    </Button>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }))

  expect(onClick).not.toHaveBeenCalled()
})

it('never submits its form when a blocked submit button is pressed', () => {
  const onSubmit = vi.fn()
  render(
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <Button type="submit" tone="primary" availability="blocked">
        Recruit
      </Button>
    </form>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Recruit' }))

  expect(onSubmit).not.toHaveBeenCalled()
})

it('fires the action of a marked button when pressed', () => {
  const onClick = vi.fn()
  render(
    <Button type="button" tone="primary" availability="marked" onClick={onClick}>
      Upgrade
    </Button>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }))

  expect(onClick).toHaveBeenCalledTimes(1)
})

it('never announces a marked button disabled, since it still acts', () => {
  render(
    <Button type="button" tone="primary" availability="marked">
      Upgrade
    </Button>,
  )

  expect(screen.getByRole('button', { name: 'Upgrade' }).getAttribute('aria-disabled')).toBeNull()
})

it('draws a marked button with the dashed border of a blocked one', () => {
  expect(classesOf('quiet', 'marked')).toContain('border-dashed')
})

it('fires the action of an available button when pressed', () => {
  const onClick = vi.fn()
  render(
    <Button type="button" tone="primary" onClick={onClick}>
      Upgrade
    </Button>,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Upgrade' }))

  expect(onClick).toHaveBeenCalledTimes(1)
})

const classesOf = (tone: ActionTone, availability?: ButtonAvailability): ReadonlyArray<string> => {
  render(
    <Button type="button" tone={tone} availability={availability ?? 'available'}>
      Upgrade
    </Button>,
  )
  return screen.getByRole('button', { name: 'Upgrade' }).className.split(' ')
}

it.each<[ActionTone, string]>([
  ['primary', 'min-h-action'],
  ['quiet', 'min-h-secondary'],
  ['text', 'min-h-control'],
])('gives a %s action its height', (tone, height) => {
  expect(classesOf(tone)).toContain(height)
})

it('keeps a blocked quiet action at its secondary height', () => {
  expect(classesOf('quiet', 'blocked')).toContain('min-h-secondary')
})

it('holds a text action at the touch target width', () => {
  expect(classesOf('text')).toContain('min-w-12')
})

it.each<[ActionTone, boolean]>([
  ['primary', true],
  ['quiet', false],
  ['text', false],
])('fills the primary action alone: %s filled is %s', (tone, isFilled) => {
  expect(classesOf(tone).includes('bg-action')).toBe(isFilled)
})

it('centers the label of a waiting action in its pill', () => {
  expect(classesOf('quiet', 'waiting')).toContain('justify-center')
})

it('keeps the padding of a waiting pill', () => {
  expect(classesOf('quiet', 'waiting')).toContain('px-5')
})

it('gives the padding of a pill waiting in place to its clock', () => {
  const classes = classesOf('quiet', 'waitingInPlace')

  expect(classes).toContain('px-2')
  expect(classes).not.toContain('px-5')
})

it('marks a pill waiting in place as busy', () => {
  classesOf('quiet', 'waitingInPlace')

  expect(screen.getByRole('button', { name: 'Upgrade' }).getAttribute('aria-busy')).toBe('true')
})

it('marks its name with the language of a name read in one language', () => {
  render(
    <Button type="button" tone="quiet" accessibleName={lineLabelOf('Detener granja', 'es')}>
      Detener
    </Button>,
  )

  expect(screen.getByRole('button', { name: 'Detener granja' }).getAttribute('lang')).toBe('es')
})

it('marks no language on a name read in two languages', () => {
  const stop: Label = {
    text: 'Stop farm',
    language: 'en',
    translation: { text: 'Detener granja', language: 'es' },
  }
  render(
    <Button type="button" tone="quiet" accessibleName={stop}>
      Stop
    </Button>,
  )

  expect(
    screen.getByRole('button', { name: 'Stop farm Detener granja' }).hasAttribute('lang'),
  ).toBe(false)
})

const readingWordClasses = (): ReadonlyArray<string> => {
  render(
    <Button type="button" tone="readingWord">
      home
    </Button>,
  )
  return screen.getByRole('button', { name: 'home' }).className.split(' ')
}

it.each<ActionTone>(['primary', 'quiet', 'text'])(
  'frames a %s action with a border, its vertical padding and the action focus outline',
  (tone) => {
    expect(classesOf(tone)).toEqual(
      expect.arrayContaining(['border', 'py-2', 'focus-visible:outline-focus']),
    )
  },
)

it('draws a reading word inline on the reading line in on-block ink at the touch target', () => {
  expect(readingWordClasses()).toEqual(
    expect.arrayContaining([
      'inline-flex',
      'align-baseline',
      'border-0',
      'p-0',
      'text-reading',
      'text-on-block',
      'underline',
      'min-h-control',
      'min-w-12',
      'focus-visible:outline-on-block',
    ]),
  )
})

it('draws a reading word without the border, padding and focus color of an action', () => {
  expect(readingWordClasses()).not.toEqual(
    expect.arrayContaining([expect.stringMatching(/^(border|py-2|focus-visible:outline-focus)$/)]),
  )
})

const rowClasses = (): ReadonlyArray<string> => {
  render(
    <Button type="button" tone="row">
      Lesson 2
    </Button>,
  )
  return screen.getByRole('button', { name: 'Lesson 2' }).className.split(' ')
}

it('draws a row full width with its lines stacked and left-aligned at the secondary height', () => {
  expect(rowClasses()).toEqual(
    expect.arrayContaining([
      'flex',
      'w-full',
      'flex-col',
      'items-start',
      'text-left',
      'min-h-secondary',
      'focus-visible:outline-focus',
      'border-0',
      'bg-transparent',
    ]),
  )
})

it('draws a row without the border, the fill and the vertical padding of an action', () => {
  expect(rowClasses()).not.toEqual(
    expect.arrayContaining([expect.stringMatching(/^(border|py-2|bg-action)$/)]),
  )
})
