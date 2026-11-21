import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { renderAppAt } from './renderAppAt.testSupport'
import { stubApiClient } from './stubApiClient.testSupport'

const browseIn = (language: string): void => {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(language)
}

const blockStorage = (): void => {
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError')
  })
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

const titleOf = async (): Promise<string> =>
  (await screen.findByRole('heading', { level: 1 })).textContent ?? ''

const checkedScaffoldOf = async (): Promise<string> => {
  const radios = await screen.findAllByRole('radio')
  const checked = radios.find((radio) => radio instanceof HTMLInputElement && radio.checked)
  return checked?.getAttribute('value') ?? ''
}

it('draws sign-in in Spanish for a Spanish browser', async () => {
  browseIn('es-MX')
  renderAppAt('/sign-in', stubApiClient())

  expect(await titleOf()).toBe('Entra en tu pueblo')
  await vi.waitFor(() => expect(document.documentElement.lang).toBe('es'))
})

it('draws sign-in in English for an English browser', async () => {
  browseIn('en-US')
  renderAppAt('/sign-in', stubApiClient())

  expect(await titleOf()).toBe('Sign in to your town')
  await vi.waitFor(() => expect(document.documentElement.lang).toBe('en'))
})

it.each([
  ['/sign-up', 'Create your account'],
  ['/forgot-password', 'Reset your password'],
  ['/reset-password?token=link-token', 'Choose a new password'],
  ['/verify-email', 'Confirm your email'],
])('draws %s in English for an English browser', async (path, title) => {
  browseIn('en-GB')
  renderAppAt(path, stubApiClient())

  expect(await titleOf()).toBe(title)
})

it('switches the account screens to Spanish and keeps the switch', async () => {
  browseIn('en-US')
  renderAppAt('/sign-in', stubApiClient())

  fireEvent.click(await screen.findByRole('button', { name: 'Español' }))

  expect(await titleOf()).toBe('Entra en tu pueblo')
  await vi.waitFor(() => expect(document.documentElement.lang).toBe('es'))
  cleanup()
  renderAppAt('/forgot-password', stubApiClient())
  expect(await titleOf()).toBe('Recupera tu contraseña')
})

it('switches the account screens back to English', async () => {
  browseIn('es-ES')
  renderAppAt('/sign-in', stubApiClient())

  fireEvent.click(await screen.findByRole('button', { name: 'English' }))

  expect(await titleOf()).toBe('Sign in to your town')
  await vi.waitFor(() => expect(document.documentElement.lang).toBe('en'))
})

it("draws the browser's language when the storage is blocked", async () => {
  browseIn('es-AR')
  blockStorage()
  renderAppAt('/sign-in', stubApiClient())

  expect(await titleOf()).toBe('Entra en tu pueblo')
  fireEvent.click(screen.getByRole('button', { name: 'English' }))
  expect(await titleOf()).toBe('Sign in to your town')
})

it('preselects the Spanish scaffold for a Spanish browser', async () => {
  browseIn('es-CO')
  renderAppAt('/sign-up', stubApiClient())

  expect(await checkedScaffoldOf()).toBe('es')
})

it('preselects no scaffold for an English browser', async () => {
  browseIn('en-US')
  renderAppAt('/sign-up', stubApiClient())

  expect(await checkedScaffoldOf()).toBe('none')
})

it('preselects the scaffold of the language switched to', async () => {
  browseIn('en-US')
  renderAppAt('/sign-up', stubApiClient())

  fireEvent.click(await screen.findByRole('button', { name: 'Español' }))

  expect(await titleOf()).toBe('Crea tu cuenta')
  expect(await checkedScaffoldOf()).toBe('es')
})
