import {
  authSignUpScaffoldEs,
  authSignUpScaffoldLabel,
  authSignUpScaffoldNone,
  refusalTokenInvalid,
  refusalUnexpected,
  settingsCardsKept,
  settingsSaved,
  settingsSaving,
  settingsTitle,
} from '@mygame/catalog'
import type { Player, Scaffold } from '@mygame/contracts'
import { act, fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'

const scaffoldLines: Readonly<Record<Scaffold, string>> = {
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

const scaffoldGroup = (): HTMLElement =>
  screen.getByRole('group', { name: authSignUpScaffoldLabel() })

const signedInAs = (scaffold: Scaffold, overrides: Partial<ApiClient> = {}): ApiClient =>
  stubApiClient({ currentPlayer: async () => ({ ...knownPlayer, scaffold }), ...overrides })

it('draws the stored scaffold as the picked help language', async () => {
  renderAppAt('/settings', signedInAs('none'))

  expect(await screen.findByRole('heading', { level: 1, name: settingsTitle() })).toBeTruthy()
  expect((await scaffoldRadioOf('none')).checked).toBe(true)
  expect((await scaffoldRadioOf('es')).checked).toBe(false)
  expect(screen.getByText(settingsCardsKept())).toBeTruthy()
})

const heldAnswer = (): {
  readonly answer: Promise<ApiOutcome<Player>>
  readonly settle: (outcome: ApiOutcome<Player>) => void
} => {
  let settle: (outcome: ApiOutcome<Player>) => void = () => undefined
  const answer = new Promise<ApiOutcome<Player>>((resolve) => {
    settle = resolve
  })
  return { answer, settle }
}

const storedAs = (scaffold: Scaffold): ApiOutcome<Player> => ({
  ok: true,
  value: { ...knownPlayer, scaffold, scaffoldVersion: 1 },
})

it('sends a pick to the api once while it is saving', async () => {
  const held = heldAnswer()
  const picks: Scaffold[] = []
  renderAppAt(
    '/settings',
    signedInAs('es', {
      changeScaffold: (scaffold) => {
        picks.push(scaffold)
        return held.answer
      },
    }),
    { isStrict: true },
  )
  const none = await scaffoldRadioOf('none')
  const es = await scaffoldRadioOf('es')

  await act(async () => {
    fireEvent.click(none)
    fireEvent.click(es)
  })

  expect(picks).toEqual(['none'])
})

it('draws the pick as saving while the api answers', async () => {
  const held = heldAnswer()
  renderAppAt('/settings', signedInAs('es', { changeScaffold: () => held.answer }))

  fireEvent.click(await scaffoldRadioOf('none'))

  expect((await screen.findByRole('status')).textContent).toBe(settingsSaving())
  expect((await scaffoldRadioOf('none')).checked).toBe(true)
  expect(scaffoldGroup().hasAttribute('disabled')).toBe(true)
})

it('keeps the pick once the api stores it', async () => {
  renderAppAt('/settings', signedInAs('es', { changeScaffold: async () => storedAs('none') }))

  fireEvent.click(await scaffoldRadioOf('none'))

  expect(await screen.findByText(settingsSaved())).toBeTruthy()
  expect((await scaffoldRadioOf('none')).checked).toBe(true)
  expect(scaffoldGroup().hasAttribute('disabled')).toBe(false)
})

it('returns to the stored scaffold when the api refuses the pick', async () => {
  renderAppAt(
    '/settings',
    signedInAs('es', {
      changeScaffold: async () => ({ ok: false, refusal: 'TokenInvalid' }),
    }),
  )

  fireEvent.click(await scaffoldRadioOf('none'))

  expect((await screen.findByRole('alert')).textContent).toBe(refusalTokenInvalid())
  expect((await scaffoldRadioOf('es')).checked).toBe(true)
  expect((await scaffoldRadioOf('none')).checked).toBe(false)
})

it('returns to the stored scaffold when the api cannot be reached', async () => {
  renderAppAt(
    '/settings',
    signedInAs('none', {
      changeScaffold: async () => ({ ok: false, refusal: 'Unexpected' }),
    }),
  )

  fireEvent.click(await scaffoldRadioOf('es'))

  expect((await screen.findByRole('alert')).textContent).toBe(refusalUnexpected())
  expect((await scaffoldRadioOf('none')).checked).toBe(true)
})
