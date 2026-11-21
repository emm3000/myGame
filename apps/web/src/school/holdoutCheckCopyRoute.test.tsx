import { en, es } from '@mygame/catalog'
import type { HoldoutChecks, TownOverview } from '@mygame/contracts'
import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import { shownLinesDrawnAlone } from '../town/lineDrawnAlone.testSupport'

type CopyLanguage = Pick<TownOverview, 'scaffold' | 'chromePhase'>

const spanishPhase: CopyLanguage = { scaffold: 'es', chromePhase: 'scaffold' }
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

it('draws each line of the check alone in Spanish in the Spanish phase', async () => {
  renderAppAt('/school/check/1/8', servingChecksIn(spanishPhase, firstBandDue))

  expect(await screen.findByRole('button', { name: es.holdoutCheckStart() })).toBeDefined()
  for (const line of [
    es.holdoutCheckTitle(),
    es.holdoutCheckDueLine({ band: 1, week: 8 }),
    es.holdoutCheckStart(),
    es.holdoutCheckSkipLine(),
    es.holdoutCheckSkip(),
  ]) {
    expect(shownLinesDrawnAlone(line, 'es'), line).toHaveLength(1)
  }
})

it('draws the way back to the school alone in Spanish in the Spanish phase', async () => {
  renderAppAt('/school/check/1/8', servingChecksIn(spanishPhase, otherBandDue))

  expect(await screen.findByRole('link', { name: es.townGoToSchool() })).toBeDefined()
  expect(shownLinesDrawnAlone(es.townGoToSchool(), 'es')).toHaveLength(1)
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

const askingWith = (gloss: string): HoldoutChecks => ({
  checks: [
    {
      kind: 'asking',
      band: 1,
      week: 8,
      items: [
        { wordId: 'word-house', word: 'house', choices: [{ choiceId: 'choice-house', gloss }] },
      ],
    },
  ],
})

it('marks each choice of the check as Spanish for an es player', async () => {
  renderAppAt('/school/check/1/8', servingChecksIn(englishPhase, askingWith('casa')))

  expect(await screen.findByRole('radio', { name: 'casa' })).toBeDefined()
  expect(shownLinesDrawnAlone('casa', 'es')).toHaveLength(1)
})

it('marks each choice of the check as English under none', async () => {
  const definition = 'a building where people live'
  renderAppAt('/school/check/1/8', servingChecksIn(noScaffold, askingWith(definition)))

  expect(await screen.findByRole('radio', { name: definition })).toBeDefined()
  expect(shownLinesDrawnAlone(definition, 'en')).toHaveLength(1)
})

it('names the way back to the school in English over Spanish in the both phase', async () => {
  renderAppAt('/school/check/1/8', servingChecksIn(bothPhase, otherBandDue))

  expect(
    await screen.findByRole('link', { name: `${en.townGoToSchool()} ${es.townGoToSchool()}` }),
  ).toBeDefined()
})
