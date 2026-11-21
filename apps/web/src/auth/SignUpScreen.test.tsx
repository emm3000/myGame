import { en, es } from '@mygame/catalog'
import type { Scaffold, SignUpRequest } from '@mygame/contracts'
import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { linesDrawnAlone } from '../town/lineDrawnAlone.testSupport'
import { renderAppAt } from './renderAppAt.testSupport'
import { knownPlayer, stubApiClient } from './stubApiClient.testSupport'

beforeEach(() => {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-ES')
})

const browseIn = (language: string): void => {
  vi.spyOn(navigator, 'language', 'get').mockReturnValue(language)
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

const scaffoldLines: Record<Scaffold, string> = {
  es: es.scaffoldEs(),
  none: es.scaffoldNone(),
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
  fireEvent.change(screen.getByLabelText(es.authEmail()), {
    target: { value: request.email },
  })
  fireEvent.change(screen.getByLabelText(es.authPassword()), {
    target: { value: request.password },
  })
  fireEvent.click(screen.getByRole('button', { name: es.authSignUpSubmit() }))
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

  expect(await screen.findByText(es.refusalEmailTaken())).toBeDefined()
  expect(screen.getByLabelText(es.authEmail()).getAttribute('aria-invalid')).toBe('true')
})

it('marks the email field for a malformed email the api refused', async () => {
  renderAppAt(
    '/sign-up',
    stubApiClient({ signUp: async () => ({ ok: false, refusal: 'MalformedEmail' }) }),
  )

  await fillSignUp(newcomer)

  expect(await screen.findByText(es.refusalMalformedEmail())).toBeDefined()
  expect(screen.getByLabelText(es.authEmail()).getAttribute('aria-invalid')).toBe('true')
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

  expect(await screen.findByText(es.refusalWeakPassword())).toBeDefined()
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

  expect(await screen.findByRole('heading', { level: 2, name: es.townNamingTitle() })).toBeDefined()
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

it('locks the scaffold choice while the sign-up is in flight', async () => {
  renderAppAt('/sign-up', stubApiClient({ signUp: () => new Promise(() => undefined) }))

  await fillSignUp(newcomer)

  await vi.waitFor(() =>
    expect(
      screen.getByRole('group', { name: es.scaffoldLabel() }).getAttribute('aria-disabled'),
    ).toBe('true'),
  )
})

it.each([
  ['es-ES', es, 'es'],
  ['en-US', en, 'en'],
] as const)(
  'says under the scaffold choice for a %s browser that the scaffold can change later',
  async (browserLanguage, catalog, language) => {
    browseIn(browserLanguage)
    renderAppAt('/sign-up', stubApiClient())

    const [line] = await linesDrawnAlone(catalog.authSignUpScaffoldChange(), language)
    const group = screen.getByRole('group', { name: catalog.scaffoldLabel() })

    expect(line).toBeDefined()
    expect(group.nextElementSibling?.contains(line ?? null)).toBe(true)
  },
)

it('keeps the picked scaffold while the sign-up is in flight', async () => {
  renderAppAt('/sign-up', stubApiClient({ signUp: () => new Promise(() => undefined) }))

  await fillSignUp(newcomer)
  await vi.waitFor(() =>
    expect(
      screen.getByRole('group', { name: es.scaffoldLabel() }).getAttribute('aria-disabled'),
    ).toBe('true'),
  )
  fireEvent.click(await scaffoldRadioOf('none'))

  expect((await scaffoldRadioOf('es')).checked).toBe(true)
  expect((await scaffoldRadioOf('none')).checked).toBe(false)
})
