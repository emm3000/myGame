import { en, es } from '@mygame/catalog'
import type { Placement, TownOverview } from '@mygame/contracts'
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

const offered: Placement = { kind: 'offered' }

const closedWithScores: Placement = {
  kind: 'closed',
  scores: [{ band: 1, score: 9, takenAt: knownTown.readAt, isPlacedOut: true }],
}

const servingPlacementIn = (language: CopyLanguage, placement: Placement): ApiClient =>
  stubApiClient({
    currentPlayer: async () => ({ ...knownPlayer, ...language }),
    town: async () => ({ ok: true, value: { ...knownTown, ...language } }),
    placement: async () => ({ ok: true, value: placement }),
  })

it('offers the placement in Spanish in the Spanish phase', async () => {
  renderAppAt('/placement', servingPlacementIn(spanishPhase, offered))

  expect(await screen.findByRole('button', { name: es.placementStart() })).toBeDefined()
  expect(screen.getByRole('heading', { level: 1, name: es.placementTitle() })).toBeDefined()
})

it('keeps the placement in Spanish for an es player in the both phase', async () => {
  renderAppAt('/placement', servingPlacementIn(bothPhase, offered))

  expect(await screen.findByText(es.placementOfferedLine())).toBeDefined()
})

it('keeps the placement in Spanish for an es player in the English phase', async () => {
  renderAppAt('/placement', servingPlacementIn(englishPhase, offered))

  expect(await screen.findByRole('button', { name: es.placementSkip() })).toBeDefined()
  expect(screen.getByRole('heading', { level: 1, name: es.placementTitle() })).toBeDefined()
})

it('offers the placement in English under none', async () => {
  renderAppAt('/placement', servingPlacementIn(noScaffold, offered))

  expect(await screen.findByRole('button', { name: en.placementStart() })).toBeDefined()
  expect(screen.getByRole('heading', { level: 1, name: en.placementTitle() })).toBeDefined()
  expect(screen.getByText(en.placementOfferedLine())).toBeDefined()
})

it('shows the placement result in English under none', async () => {
  renderAppAt('/placement', servingPlacementIn(noScaffold, closedWithScores))

  expect(await screen.findByText(en.placementResultBand({ band: 1, score: 9 }))).toBeDefined()
  expect(screen.getByText(en.placementPlacedOut())).toBeDefined()
})

const askingWith = (gloss: string): Placement => ({
  kind: 'asking',
  band: 1,
  scores: [],
  items: [{ wordId: 'word-house', word: 'house', choices: [{ choiceId: 'choice-house', gloss }] }],
})

it('marks each choice of the placement as Spanish for an es player', async () => {
  renderAppAt('/placement', servingPlacementIn(englishPhase, askingWith('casa')))

  expect(await screen.findByRole('radio', { name: 'casa' })).toBeDefined()
  expect(shownLinesDrawnAlone('casa', 'es')).toHaveLength(1)
})

it('marks each choice of the placement as English under none', async () => {
  const definition = 'a building where people live'
  renderAppAt('/placement', servingPlacementIn(noScaffold, askingWith(definition)))

  expect(await screen.findByRole('radio', { name: definition })).toBeDefined()
  expect(shownLinesDrawnAlone(definition, 'en')).toHaveLength(1)
})

it('offers the placement from the town home in English under none', async () => {
  renderAppAt('/', servingPlacementIn(noScaffold, offered))

  expect(await screen.findByRole('link', { name: en.placementOfferLink() })).toBeDefined()
})
