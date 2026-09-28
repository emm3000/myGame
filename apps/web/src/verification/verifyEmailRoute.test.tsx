import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiRefusal } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { stubApiClient } from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

it('verifies the email from the link', async () => {
  const postedTokens: string[] = []
  renderAppAt(
    '/verify-email?token=link-token',
    stubApiClient({
      verifyEmail: async (token) => {
        postedTokens.push(token)
        return undefined
      },
    }),
  )

  const link = await screen.findByRole('link', { name: copy.verification.verify.toFief })

  expect(screen.getByRole('status').textContent).toBe(copy.verification.verify.verified)
  expect(link.getAttribute('href')).toBe('/')
  expect(postedTokens).toEqual(['link-token'])
})

it('posts the link token once', async () => {
  let posts = 0
  renderAppAt(
    '/verify-email?token=link-token',
    stubApiClient({
      verifyEmail: async () => {
        posts += 1
        return undefined
      },
    }),
    { isStrict: true },
  )

  await screen.findByRole('link', { name: copy.verification.verify.toFief })

  expect(posts).toBe(1)
})

it('shows the verifying line while the api answers', async () => {
  renderAppAt(
    '/verify-email?token=link-token',
    stubApiClient({ verifyEmail: () => new Promise<ApiRefusal | undefined>(() => {}) }),
  )

  expect((await screen.findByRole('status')).textContent).toBe(copy.verification.verify.verifying)
})

it('shows the invalid link for a refused token', async () => {
  renderAppAt(
    '/verify-email?token=used-token',
    stubApiClient({ verifyEmail: async () => 'TokenInvalid' }),
  )

  expect((await screen.findByRole('alert')).textContent).toBe(
    'Ese enlace no vale: ha caducado, ya se ha usado o nunca se envió. Pide otro.',
  )
  expect(
    screen.getByRole('link', { name: copy.verification.verify.toSignIn }).getAttribute('href'),
  ).toBe('/sign-in')
})

it('shows the Spanish line of an unexpected answer', async () => {
  renderAppAt(
    '/verify-email?token=link-token',
    stubApiClient({ verifyEmail: async () => 'Unexpected' }),
  )

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.Unexpected)
})

it('shows the invalid link without a request when the token is missing', async () => {
  let posts = 0
  renderAppAt(
    '/verify-email',
    stubApiClient({
      verifyEmail: async () => {
        posts += 1
        return undefined
      },
    }),
  )

  expect((await screen.findByRole('alert')).textContent).toBe(copy.refusals.TokenInvalid)
  expect(posts).toBe(0)
})
