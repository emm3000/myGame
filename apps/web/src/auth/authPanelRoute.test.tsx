import { shellTitle } from '@mygame/catalog'
import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderAppAt } from './renderAppAt.testSupport'
import { stubApiClient } from './stubApiClient.testSupport'

const guestPaths = ['/sign-in', '/sign-up', '/forgot-password'] as const

it.each(guestPaths)('opens %s with no scene band and no image', async (path) => {
  renderAppAt(path, stubApiClient())

  await screen.findByRole('heading', { level: 1 })

  expect(document.querySelector('[data-terrain]')).toBeNull()
  expect(document.querySelector('img')).toBeNull()
})

it.each(guestPaths)(
  "shows Townword on the guest screens and in the browser's title: %s",
  async (path) => {
    renderAppAt(path, stubApiClient())

    const heading = await screen.findByRole('heading', { level: 1 })

    expect(heading.closest('section')?.contains(screen.getByText('Townword'))).toBe(true)
    expect(document.title).toBe('Townword')
  },
)

it.each(['/sign-up', '/sign-in'])(
  'says what the game is on sign-up and sign-in: %s',
  async (path) => {
    renderAppAt(path, stubApiClient())

    const heading = await screen.findByRole('heading', { level: 1 })

    const line = screen.getByText('Aprende inglés mientras tu pueblo crece.')
    expect(heading.closest('section')?.contains(line)).toBe(true)
  },
)

it('names the game inside the sign-in panel', async () => {
  renderAppAt('/sign-in', stubApiClient())

  const heading = await screen.findByRole('heading', { level: 1 })

  const panel = heading.closest('section')
  expect(panel?.contains(screen.getByText(shellTitle()))).toBe(true)
})
