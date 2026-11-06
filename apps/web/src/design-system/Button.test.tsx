import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Button, type ButtonTone } from './Button'

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

const classesOf = (tone: ButtonTone): ReadonlyArray<string> => {
  render(
    <Button type="button" tone={tone}>
      Upgrade
    </Button>,
  )
  return screen.getByRole('button', { name: 'Upgrade' }).className.split(' ')
}

it('fills the primary action as an ink pill at action height', () => {
  expect(classesOf('primary')).toEqual(
    expect.arrayContaining(['min-h-action', 'rounded-pill', 'bg-action', 'text-button']),
  )
})

it('outlines a quiet action as a pill at secondary height', () => {
  const classes = classesOf('quiet')

  expect(classes).toEqual(
    expect.arrayContaining(['min-h-secondary', 'rounded-pill', 'border-line-strong', 'text-label']),
  )
  expect(classes).not.toContain('bg-action')
})

it('keeps a text action at control height with no fill', () => {
  const classes = classesOf('text')

  expect(classes).toContain('min-h-control')
  expect(classes).toContain('bg-transparent')
})

it('keeps a blocked quiet action at its secondary height', () => {
  render(
    <Button type="button" tone="quiet" availability="blocked">
      Upgrade
    </Button>,
  )

  expect(screen.getByRole('button', { name: 'Upgrade' }).className.split(' ')).toContain(
    'min-h-secondary',
  )
})
