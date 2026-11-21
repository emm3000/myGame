import { en, es } from '@mygame/catalog'
import type { Player, Scaffold, TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { shownLinesDrawnAlone } from '../town/lineDrawnAlone.testSupport'

const scaffoldLines: Readonly<Record<Scaffold, string>> = {
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

const scaffoldGroup = (): HTMLElement => screen.getByRole('group', { name: es.scaffoldLabel() })

const signedInAs = (scaffold: Scaffold, overrides: Partial<ApiClient> = {}): ApiClient =>
  stubApiClient({ currentPlayer: async () => ({ ...knownPlayer, scaffold }), ...overrides })

it('draws the stored scaffold as the picked help language', async () => {
  renderAppAt('/settings', signedInAs('none'))

  expect(await screen.findByRole('heading', { level: 1, name: es.settingsTitle() })).toBeTruthy()
  expect((await scaffoldRadioOf('none')).checked).toBe(true)
  expect((await scaffoldRadioOf('es')).checked).toBe(false)
  expect(screen.getByText(es.settingsCardsKept())).toBeTruthy()
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

  expect((await screen.findByRole('status')).textContent).toBe(es.settingsSaving())
  expect((await scaffoldRadioOf('none')).checked).toBe(true)
  expect(scaffoldGroup().getAttribute('aria-disabled')).toBe('true')
})

it('keeps the pick once the api stores it', async () => {
  renderAppAt('/settings', signedInAs('es', { changeScaffold: async () => storedAs('none') }))

  fireEvent.click(await scaffoldRadioOf('none'))

  expect(await screen.findByText(es.settingsSaved())).toBeTruthy()
  expect((await scaffoldRadioOf('none')).checked).toBe(true)
  expect(scaffoldGroup().getAttribute('aria-disabled')).toBe('false')
})

it('announces saving then saved in the status region drawn empty before the pick', async () => {
  const held = heldAnswer()
  renderAppAt('/settings', signedInAs('es', { changeScaffold: () => held.answer }))
  const none = await scaffoldRadioOf('none')
  const region = screen.getByRole('status')

  expect(region.textContent).toBe('')

  fireEvent.click(none)

  await vi.waitFor(() => expect(region.textContent).toBe(es.settingsSaving()))

  await act(async () => held.settle(storedAs('none')))

  expect(region.textContent).toBe(es.settingsSaved())
  expect(screen.getByRole('status')).toBe(region)
})

it('keeps the focus on the picked radio through saving and saved', async () => {
  const held = heldAnswer()
  renderAppAt('/settings', signedInAs('es', { changeScaffold: () => held.answer }))
  const none = await scaffoldRadioOf('none')

  none.focus()
  fireEvent.click(none)

  expect((await screen.findByRole('status')).textContent).toBe(es.settingsSaving())
  expect(none.closest(':disabled')).toBeNull()
  expect(document.activeElement).toBe(none)

  await act(async () => held.settle(storedAs('none')))

  expect(screen.getByRole('status').textContent).toBe(es.settingsSaved())
  expect(document.activeElement).toBe(none)
})

it('returns to the stored scaffold when the api cannot be reached', async () => {
  renderAppAt(
    '/settings',
    signedInAs('none', {
      changeScaffold: async () => ({ ok: false, refusal: 'Unexpected' }),
    }),
  )

  fireEvent.click(await scaffoldRadioOf('es'))

  expect((await screen.findByRole('alert')).textContent).toBe(es.refusalUnexpected())
  expect((await scaffoldRadioOf('none')).checked).toBe(true)
  expect((await scaffoldRadioOf('es')).checked).toBe(false)
})

const signedInIn = (language: Pick<TownOverview, 'scaffold' | 'chromePhase'>): ApiClient =>
  stubApiClient({
    currentPlayer: async () => ({ ...knownPlayer, ...language }),
    town: async () => ({ ok: true, value: { ...knownTown, ...language } }),
  })

it('keeps the settings and the sign-out in Spanish for an es player in the English phase', async () => {
  renderAppAt('/settings', signedInIn({ scaffold: 'es', chromePhase: 'english' }))

  expect(await screen.findByRole('heading', { level: 1, name: es.settingsTitle() })).toBeTruthy()
  expect(shownLinesDrawnAlone(es.settingsTitle(), 'es')).toHaveLength(1)
  expect(
    screen.getByRole('group', { name: es.scaffoldLabel() }).closest('[lang]')?.getAttribute('lang'),
  ).toBe('es')
  expect(shownLinesDrawnAlone(es.settingsCardsKept(), 'es')).toHaveLength(1)
  expect(shownLinesDrawnAlone(es.shellSignOut(), 'es')).toHaveLength(1)
})

it('draws the settings and the sign-out in English under none', async () => {
  renderAppAt('/settings', signedInIn({ scaffold: 'none', chromePhase: 'english' }))

  expect(await screen.findByRole('heading', { level: 1, name: en.settingsTitle() })).toBeTruthy()
  expect(shownLinesDrawnAlone(en.settingsTitle(), 'en')).toHaveLength(1)
  expect(
    screen.getByRole('group', { name: en.scaffoldLabel() }).closest('[lang]')?.getAttribute('lang'),
  ).toBe('en')
  expect(shownLinesDrawnAlone(en.settingsCardsKept(), 'en')).toHaveLength(1)
  expect(shownLinesDrawnAlone(en.shellSignOut(), 'en')).toHaveLength(1)
})
