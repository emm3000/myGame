import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Button } from './Button'

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
