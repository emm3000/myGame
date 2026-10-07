import type { FiefOverview, HintKind } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import {
  knownFief,
  knownFiefPath,
  knownPlayer,
  stubApiClient,
} from '../auth/stubApiClient.testSupport'
import { copy } from '../copy'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownFief.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const peasantsShort: FiefOverview = {
  ...knownFief,
  peasants: {
    ...knownFief.peasants,
    free: 0,
    projectedFree: 0,
    occupied: 12,
    projectedOccupied: 12,
  },
}

const fiefOf = (changes: Partial<FiefOverview>): FiefOverview => ({ ...knownFief, ...changes })

const slotBusy = fiefOf({
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    startedAt: knownFief.readAt,
    finishesAt: '2026-09-22T12:30:00.000Z',
  },
})

const peasantsShortWithSlotBusy: FiefOverview = { ...peasantsShort, slot: slotBusy.slot }

const winterLoweringFood = fiefOf({
  season: {
    kind: 'winter',
    year: 1,
    endsAt: '2026-09-25T12:00:00.000Z',
    multiplierPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 75 },
    durationPercent: { build: 100, study: 100, train: 100, road: 100 },
  },
})

const summerChangingNoRate = fiefOf({
  season: {
    kind: 'summer',
    year: 1,
    endsAt: '2026-09-25T12:00:00.000Z',
    multiplierPercent: { wood: 100, stone: 100, iron: 100, gold: 100, food: 100 },
    durationPercent: { build: 75, study: 100, train: 100, road: 100 },
  },
})

const libraryBuilt = fiefOf({
  buildings: {
    ...knownFief.buildings,
    library: { ...knownFief.buildings.library, level: 1 },
  },
})

const barracksBuilt = fiefOf({
  buildings: {
    ...knownFief.buildings,
    barracks: { ...knownFief.buildings.barracks, level: 1 },
  },
})

const stoneFull = fiefOf({
  resources: {
    ...knownFief.resources,
    stone: { ...knownFief.resources.stone, amount: knownFief.resources.stone.capacity },
  },
})

const infantryAtHome = fiefOf({ units: { ...knownFief.units, infantry: 5 } })

const mapPath = `${knownFiefPath}/mapa`

const showAt = async (
  path: string,
  overview: FiefOverview,
  seenHints: ReadonlyArray<HintKind> = [],
  overrides: Partial<ApiClient> = {},
): Promise<void> => {
  renderAppAt(
    path,
    stubApiClient({
      currentPlayer: async () => ({ ...knownPlayer, seenHints: [...seenHints] }),
      fief: async () => ({ ok: true, value: overview }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

it('shows the peasants hint the first time peasants block a building', async () => {
  await showAt(knownFiefPath, peasantsShort)

  const note = screen.getByRole('note')
  expect(within(note).getByText(copy.hints.lines.peasants)).toBeDefined()
  expect(within(note).getByRole('button', { name: copy.hints.dismiss })).toBeDefined()
})

it('shows no hint while no trigger holds', async () => {
  await showAt(knownFiefPath, knownFief)

  expect(screen.queryByRole('note')).toBeNull()
})

it('never shows a hint the player dismissed', async () => {
  await showAt(knownFiefPath, peasantsShort, ['peasants'])

  expect(screen.queryByRole('note')).toBeNull()
})

it('shows one hint at a time in order', async () => {
  await showAt(knownFiefPath, peasantsShortWithSlotBusy)

  expect(screen.getAllByRole('note')).toHaveLength(1)
  expect(screen.getByRole('note').textContent).toContain(copy.hints.lines.peasants)
})

it('shows the next hint of the order once the first is seen', async () => {
  await showAt(knownFiefPath, peasantsShortWithSlotBusy, ['peasants'])

  expect(screen.getByRole('note').textContent).toContain(copy.hints.lines.queue)
})

it('shows the seasons hint while a season changes a rate', async () => {
  await showAt(knownFiefPath, winterLoweringFood)

  expect(screen.getByRole('note').textContent).toContain(copy.hints.lines.seasons)
})

it('shows no seasons hint while the season changes no rate', async () => {
  await showAt(knownFiefPath, summerChangingNoRate)

  expect(screen.queryByRole('note')).toBeNull()
})

it('shows the queue hint while the build slot is busy', async () => {
  await showAt(knownFiefPath, slotBusy)

  expect(screen.getByRole('note').textContent).toContain(copy.hints.lines.queue)
})

it('shows the library hint under the library heading at level 1', async () => {
  await showAt(knownFiefPath, libraryBuilt)

  const library = screen.getByRole('region', { name: copy.study.section })
  expect(within(library).getByRole('note').textContent).toContain(copy.hints.lines.library)
})

it('shows the barracks hint under the barracks heading at level 1', async () => {
  await showAt(knownFiefPath, barracksBuilt)

  const barracks = screen.getByRole('region', { name: copy.army.section })
  expect(within(barracks).getByRole('note').textContent).toContain(copy.hints.lines.barracks)
})

it('shows the full store hint while a store is full', async () => {
  await showAt(knownFiefPath, stoneFull)

  expect(screen.getByRole('note').textContent).toContain(copy.hints.lines.fullStore)
})

it('shows the marches hint on the map with units at home', async () => {
  await showAt(mapPath, infantryAtHome)

  expect(screen.getByRole('note').textContent).toContain(copy.hints.lines.marches)
})

it('shows no marches hint on the map with nobody at home', async () => {
  await showAt(mapPath, knownFief)

  expect(screen.queryByRole('note')).toBeNull()
})

it('shows no fief hint on the map', async () => {
  await showAt(mapPath, peasantsShort)

  expect(screen.queryByRole('note')).toBeNull()
})

it('hides the hint at once when dismissed', async () => {
  const markHintSeen = vi.fn(() => new Promise<undefined>(() => undefined))
  await showAt(knownFiefPath, peasantsShort, [], { markHintSeen })

  fireEvent.click(
    within(screen.getByRole('note')).getByRole('button', { name: copy.hints.dismiss }),
  )

  expect(screen.queryByRole('note')).toBeNull()
  expect(markHintSeen).toHaveBeenCalledWith('peasants')
})

it('keeps a dismissed hint hidden on later screens without reading the session again', async () => {
  const currentPlayer = vi.fn(async () => knownPlayer)
  await showAt(knownFiefPath, peasantsShort, [], { currentPlayer })
  fireEvent.click(
    within(screen.getByRole('note')).getByRole('button', { name: copy.hints.dismiss }),
  )
  await passSeconds(0)

  fireEvent.click(screen.getByRole('link', { name: copy.shell.navigation.map }))
  await passSeconds(0)
  fireEvent.click(screen.getByRole('link', { name: copy.shell.navigation.fief }))
  await passSeconds(0)

  expect(screen.queryByRole('note')).toBeNull()
})

it('hides a hint whose dismissal was refused for the rest of the visit', async () => {
  const markHintSeen = vi.fn(async () => 'Unexpected' as const)
  await showAt(knownFiefPath, peasantsShort, [], { markHintSeen })

  fireEvent.click(
    within(screen.getByRole('note')).getByRole('button', { name: copy.hints.dismiss }),
  )
  await passSeconds(0)

  expect(screen.queryByRole('note')).toBeNull()
})

it('keeps focus where it was when a hint appears', async () => {
  const enqueueUpgrade = vi.fn(async () => ({ ok: true as const, value: slotBusy }))
  await showAt(knownFiefPath, knownFief, [], { enqueueUpgrade })
  const sawmill = screen.getByRole('listitem', { name: copy.names.buildings.sawmill })
  const upgrade = within(sawmill).getByRole('button')
  upgrade.focus()

  fireEvent.click(upgrade)
  await passSeconds(0)

  expect(screen.getByRole('note').textContent).toContain(copy.hints.lines.queue)
  expect(document.activeElement).toBe(upgrade)
})
