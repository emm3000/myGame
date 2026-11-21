import { es } from '@mygame/catalog'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { renderAppAt } from './renderAppAt.testSupport'
import { stubApiClient } from './stubApiClient.testSupport'

beforeEach(() => {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-ES')
})

const medievalWord = /feudo|vadoalto|señor|reino/i

const accountPaths = [
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password?token=link-token',
] as const

it.each(accountPaths)('uses no medieval word on the account screens: %s', async (path) => {
  renderAppAt(path, stubApiClient())

  await screen.findByRole('heading', { level: 1 })

  expect(document.body.textContent).not.toMatch(medievalWord)
})

it('uses no medieval word on the account screens: the reset request sent', async () => {
  renderAppAt('/forgot-password', stubApiClient())
  fireEvent.change(await screen.findByLabelText(es.authEmail()), {
    target: { value: 'aldonza@example.com' },
  })
  fireEvent.click(screen.getByRole('button', { name: es.passwordResetRequestSubmit() }))

  const confirmation = await screen.findByRole('status')

  expect(confirmation.textContent).not.toMatch(medievalWord)
  expect(document.body.textContent).not.toMatch(medievalWord)
})
