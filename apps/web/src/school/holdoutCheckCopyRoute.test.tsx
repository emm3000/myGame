import { en, es } from '@mygame/catalog'
import type { HoldoutChecks, TownOverview } from '@mygame/contracts'
import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'

type CopyLanguage = Pick<TownOverview, 'scaffold' | 'chromePhase'>

const bothPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'both' }
const englishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'english' }
const noScaffold: CopyLanguage = { scaffold: 'none', chromePhase: 'english' }

const firstBandDue: HoldoutChecks = { checks: [{ kind: 'due', band: 1, week: 8 }] }

const otherBandDue: HoldoutChecks = { checks: [{ kind: 'due', band: 2, week: 8 }] }

const servingChecksIn = (language: CopyLanguage, checks: HoldoutChecks): ApiClient =>
  stubApiClient({
    currentPlayer: async () => ({ ...knownPlayer, ...language }),
    town: async () => ({ ok: true, value: { ...knownTown, ...language } }),
    holdoutChecks: async () => ({ ok: true, value: checks }),
  })

it('keeps the check in Spanish for an es player in the English phase', async () => {
  renderAppAt('/school/check/1/8', servingChecksIn(englishPhase, firstBandDue))

  expect(await screen.findByRole('button', { name: es.holdoutCheckStart() })).toBeDefined()
  expect(screen.getByRole('heading', { level: 1, name: es.holdoutCheckTitle() })).toBeDefined()
  expect(screen.getByText(es.holdoutCheckDueLine({ band: 1, week: 8 }))).toBeDefined()
})

it('writes the check in English under none', async () => {
  renderAppAt('/school/check/1/8', servingChecksIn(noScaffold, firstBandDue))

  expect(await screen.findByRole('button', { name: en.holdoutCheckStart() })).toBeDefined()
  expect(screen.getByRole('heading', { level: 1, name: en.holdoutCheckTitle() })).toBeDefined()
  expect(screen.getByText(en.holdoutCheckSkipLine())).toBeDefined()
  expect(screen.getByRole('button', { name: en.holdoutCheckSkip() })).toBeDefined()
})

it('writes a check that is not open in English under none', async () => {
  renderAppAt('/school/check/1/8', servingChecksIn(noScaffold, otherBandDue))

  expect(await screen.findByText(en.holdoutCheckRefused())).toBeDefined()
})

it('names the way back to the school in English over Spanish in the both phase', async () => {
  renderAppAt('/school/check/1/8', servingChecksIn(bothPhase, otherBandDue))

  expect(
    await screen.findByRole('link', { name: `${en.townGoToSchool()} ${es.townGoToSchool()}` }),
  ).toBeDefined()
})
