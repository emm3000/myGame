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

it('names the game inside the sign-in panel', async () => {
  renderAppAt('/sign-in', stubApiClient())

  const heading = await screen.findByRole('heading', { level: 1 })

  const panel = heading.closest('section')
  expect(panel?.contains(screen.getByText(shellTitle()))).toBe(true)
})
