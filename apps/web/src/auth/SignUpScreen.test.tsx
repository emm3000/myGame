import {
  authEmail,
  authPassword,
  authSignUpScaffoldEs,
  authSignUpScaffoldLabel,
  authSignUpScaffoldNone,
  authSignUpSubmit,
  refusalEmailTaken,
  refusalMalformedEmail,
  refusalWeakPassword,
  townNamingTitle,
} from '@mygame/catalog'
import type { Scaffold, SignUpRequest } from '@mygame/contracts'
import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { renderAppAt } from './renderAppAt.testSupport'
import { knownPlayer, stubApiClient } from './stubApiClient.testSupport'

const browseIn = (language: string): void => {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(language)
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

const scaffoldLines: Record<Scaffold, string> = {
  es: authSignUpScaffoldEs(),
  none: authSignUpScaffoldNone(),
}

const scaffoldRadioOf = async (scaffold: Scaffold): Promise<HTMLInputElement> => {
  const radio = await screen.findByRole('radio', { name: scaffoldLines[scaffold] })
  if (!(radio instanceof HTMLInputElement)) {
    throw new Error('the scaffold choice is not a radio input')
  }
  return radio
}

const fillSignUp = async (request: SignUpRequest): Promise<void> => {
  fireEvent.click(await scaffoldRadioOf(request.scaffold))
  fireEvent.change(screen.getByLabelText(authEmail()), {
    target: { value: request.email },
  })
  fireEvent.change(screen.getByLabelText(authPassword()), {
    target: { value: request.password },
  })
  fireEvent.click(screen.getByRole('button', { name: authSignUpSubmit() }))
}

const newcomer: SignUpRequest = {
  email: 'aldonza@example.com',
  password: 'piedra-y-lodo',
  scaffold: 'es',
}

it('shows the Spanish message for a taken email', async () => {
  renderAppAt(
    '/sign-up',
    stubApiClient({ signUp: async () => ({ ok: false, refusal: 'EmailTaken' }) }),
  )

  await fillSignUp(newcomer)

  expect(await screen.findByText(refusalEmailTaken())).toBeDefined()
  expect(screen.getByLabelText(authEmail()).getAttribute('aria-invalid')).toBe('true')
})

it('marks the email field for a malformed email the api refused', async () => {
  renderAppAt(
    '/sign-up',
    stubApiClient({ signUp: async () => ({ ok: false, refusal: 'MalformedEmail' }) }),
  )

  await fillSignUp(newcomer)

  expect(await screen.findByText(refusalMalformedEmail())).toBeDefined()
  expect(screen.getByLabelText(authEmail()).getAttribute('aria-invalid')).toBe('true')
})

it('refuses to submit a password shorter than eight characters', async () => {
  const sentRequests: SignUpRequest[] = []
  renderAppAt(
    '/sign-up',
    stubApiClient({
      signUp: async (request) => {
        sentRequests.push(request)
        return { ok: true, value: knownPlayer }
      },
    }),
  )

  await fillSignUp({ ...newcomer, password: 'piedra7' })

  expect(await screen.findByText(refusalWeakPassword())).toBeDefined()
  expect(sentRequests).toEqual([])
})

it('signs up without founding anything', async () => {
  const sentRequests: unknown[] = []
  renderAppAt(
    '/sign-up',
    stubApiClient({
      signUp: async (request) => {
        sentRequests.push(request)
        return { ok: true, value: knownPlayer }
      },
    }),
  )

  await fillSignUp(newcomer)

  await vi.waitFor(() => expect(sentRequests).toEqual([newcomer]))
  expect(screen.getAllByRole('textbox').map((field) => field.getAttribute('name'))).toEqual([
    'email',
  ])
})

it('opens Name your town after sign-up', async () => {
  let isSignedIn = false
  renderAppAt(
    '/sign-up',
    stubApiClient({
      signUp: async () => {
        isSignedIn = true
        return { ok: true, value: knownPlayer }
      },
      currentPlayer: async () => (isSignedIn ? knownPlayer : undefined),
      town: async () => ({ ok: false, refusal: 'TownNotFound' }),
    }),
  )

  await fillSignUp(newcomer)

  expect(await screen.findByRole('heading', { level: 2, name: townNamingTitle() })).toBeDefined()
})

it('preselects es in a Spanish browser', async () => {
  browseIn('es-MX')
  renderAppAt('/sign-up', stubApiClient({}))

  expect((await scaffoldRadioOf('es')).checked).toBe(true)
})

it('preselects none otherwise', async () => {
  browseIn('en-US')
  renderAppAt('/sign-up', stubApiClient({}))

  expect((await scaffoldRadioOf('none')).checked).toBe(true)
  expect((await scaffoldRadioOf('es')).checked).toBe(false)
})

it('sends the picked scaffold', async () => {
  browseIn('es-ES')
  const sentRequests: SignUpRequest[] = []
  renderAppAt(
    '/sign-up',
    stubApiClient({
      signUp: async (request) => {
        sentRequests.push(request)
        return { ok: true, value: knownPlayer }
      },
    }),
  )

  await fillSignUp({ ...newcomer, scaffold: 'none' })

  await vi.waitFor(() => expect(sentRequests).toEqual([{ ...newcomer, scaffold: 'none' }]))
})

it('keeps the signed-out switch in browser storage', async () => {
  browseIn('es-ES')
  renderAppAt('/sign-up', stubApiClient({}))
  fireEvent.click(await scaffoldRadioOf('none'))
  cleanup()

  renderAppAt('/sign-up', stubApiClient({}))

  expect((await scaffoldRadioOf('none')).checked).toBe(true)
})

it('locks the scaffold choice while the sign-up is in flight', async () => {
  renderAppAt('/sign-up', stubApiClient({ signUp: () => new Promise(() => undefined) }))

  await fillSignUp(newcomer)

  await vi.waitFor(() =>
    expect(
      screen.getByRole('group', { name: authSignUpScaffoldLabel() }).hasAttribute('disabled'),
    ).toBe(true),
  )
})

const blockStorage = (): void => {
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('The operation is insecure.', 'SecurityError')
  })
}

it('preselects from the browser language when storage is blocked', async () => {
  browseIn('es-ES')
  blockStorage()
  renderAppAt('/sign-up', stubApiClient({}))

  expect((await scaffoldRadioOf('es')).checked).toBe(true)
})
