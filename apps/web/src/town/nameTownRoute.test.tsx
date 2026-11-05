import {
  refusalBlankTownName,
  refusalPlayerAlreadyHoldsTown,
  refusalUnexpected,
  townNamingField,
  townNamingGoToTown,
  townNamingSubmit,
  townNamingTitle,
} from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts/town'
import { act, fireEvent, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'

const withNoTown = (overrides: Partial<ApiClient> = {}): ApiClient =>
  stubApiClient({
    currentPlayer: async () => knownPlayer,
    town: async () => ({ ok: false, refusal: 'TownNotFound' }),
    ...overrides,
  })

const showNaming = async (apiClient: ApiClient): Promise<void> => {
  renderAppAt('/', apiClient)
  await screen.findByRole('heading', { level: 2, name: townNamingTitle() })
}

const typeName = (name: string): void => {
  fireEvent.change(screen.getByRole('textbox', { name: townNamingField() }), {
    target: { value: name },
  })
}

const submitButton = (): HTMLElement => screen.getByRole('button', { name: townNamingSubmit() })

it('shows Name your town to a player with no town', async () => {
  await showNaming(withNoTown())

  expect(screen.getByRole('textbox', { name: townNamingField() })).toBeDefined()
})

it('founds the town and opens its home', async () => {
  const sentNames: Array<string> = []
  await showNaming(
    withNoTown({
      foundTown: async (name) => {
        sentNames.push(name)
        return { ok: true, value: { ...knownTown, name } }
      },
    }),
  )

  typeName('  Cedar Creek ')
  fireEvent.click(submitButton())

  expect(await screen.findByRole('heading', { level: 2, name: 'Cedar Creek' })).toBeDefined()
  expect(sentNames).toEqual(['Cedar Creek'])
})

it('refuses a blank name without sending it', async () => {
  const sentNames: Array<string> = []
  await showNaming(
    withNoTown({
      foundTown: async (name) => {
        sentNames.push(name)
        return { ok: true, value: knownTown }
      },
    }),
  )

  typeName('   ')
  fireEvent.click(submitButton())

  expect(await screen.findByText(refusalBlankTownName())).toBeDefined()
  expect(sentNames).toEqual([])
})

it('waits on the founding while it is sent', async () => {
  let answer: (outcome: ApiOutcome<TownOverview>) => void = () => undefined
  await showNaming(
    withNoTown({
      foundTown: () =>
        new Promise((resolve) => {
          answer = resolve
        }),
    }),
  )

  typeName('Cedar Creek')
  fireEvent.click(submitButton())

  expect(submitButton().getAttribute('aria-busy')).toBe('true')
  await act(async () => answer({ ok: true, value: knownTown }))
})

it('offers the town to a player who already holds one', async () => {
  let townReads = 0
  await showNaming(
    withNoTown({
      town: async () => {
        townReads += 1
        return townReads === 1
          ? { ok: false, refusal: 'TownNotFound' }
          : { ok: true, value: knownTown }
      },
      foundTown: async () => ({ ok: false, refusal: 'PlayerAlreadyHoldsTown' }),
    }),
  )

  typeName('Cedar Creek')
  fireEvent.click(submitButton())
  expect(await screen.findByText(refusalPlayerAlreadyHoldsTown())).toBeDefined()
  fireEvent.click(screen.getByRole('button', { name: townNamingGoToTown() }))

  expect(await screen.findByRole('heading', { level: 2, name: knownTown.name })).toBeDefined()
})

it('keeps the name to try again after a failed request', async () => {
  let attempts = 0
  await showNaming(
    withNoTown({
      foundTown: async (name) => {
        attempts += 1
        return attempts === 1
          ? { ok: false, refusal: 'Unexpected' }
          : { ok: true, value: { ...knownTown, name } }
      },
    }),
  )

  typeName('Cedar Creek')
  fireEvent.click(submitButton())
  expect(await screen.findByText(refusalUnexpected())).toBeDefined()
  fireEvent.click(submitButton())

  expect(await screen.findByRole('heading', { level: 2, name: 'Cedar Creek' })).toBeDefined()
})
