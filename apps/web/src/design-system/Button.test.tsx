import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Button, type ButtonAvailability, type ButtonTone } from './Button'

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

const classesOf = (tone: ButtonTone, availability?: ButtonAvailability): ReadonlyArray<string> => {
  render(
    <Button type="button" tone={tone} availability={availability ?? 'available'}>
      Upgrade
    </Button>,
  )
  return screen.getByRole('button', { name: 'Upgrade' }).className.split(' ')
}

it.each<[ButtonTone, string]>([
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

it.each<[ButtonTone, boolean]>([
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
