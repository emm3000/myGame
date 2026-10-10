import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { copy } from '../copy'
import { renderAppAt } from './renderAppAt.testSupport'
import { stubApiClient } from './stubApiClient.testSupport'

const guestPaths = ['/sign-in', '/sign-up', '/forgot-password'] as const

it.each(guestPaths)('opens %s on the vega with no season', async (path) => {
  renderAppAt(path, stubApiClient())

  await screen.findByRole('heading', { level: 1 })

  const band = document.querySelector<HTMLElement>('[data-terrain]')
  expect(band?.dataset.terrain).toBe('lowlands')
  expect(band?.dataset.season).toBe('none')
})

it('names the game inside the sign-in panel, never on the scene band', async () => {
  renderAppAt('/sign-in', stubApiClient())

  const heading = await screen.findByRole('heading', { level: 1 })

  const panel = heading.closest('section')
  expect(panel?.contains(screen.getByText(copy.shell.title))).toBe(true)
  expect(document.querySelector('[data-terrain]')?.textContent).toBe('')
})
