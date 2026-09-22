import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { AppShell } from './AppShell'

it('renders the shell title', () => {
  render(<AppShell />)

  expect(screen.getByRole('heading', { level: 1, name: 'myGame' })).toBeDefined()
})
