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

it('fills the primary action alone', () => {
  expect(classesOf('quiet')).not.toContain('bg-action')
})

it('centers the label of a waiting action in its pill', () => {
  expect(classesOf('quiet', 'waiting')).toContain('justify-center')
})
