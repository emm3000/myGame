import {
  namesPlacesOffice,
  townGoalClose,
  townGoalLine,
  townGoalPeople,
  townGoalReady,
  townInWork,
  townNextGoToReport,
  townNextTitle,
  townPlacesTitleTown,
  townStocks,
  townTipClose,
  townTipFullStore,
  townTipJobs,
  townTipOffice,
  townTipPeople,
  townTipSeasons,
  townTipTitle,
  townTipWaitingList,
  townWorkTitle,
} from '@mygame/catalog'
import type { NextStep, TipKind, TownOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome, ApiRefusal } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownPlayer, knownTown, stubApiClient } from '../auth/stubApiClient.testSupport'
import type { TownGoal } from './TownGoal'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownTown.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const nothingMissing = { resources: { money: 0, food: 0, power: 0, material: 0 }, people: 0 }

const pendingFactory = (missing: Extract<TownGoal, { state: 'pending' }>['missing']): TownGoal => ({
  position: 2,
  count: 9,
  building: 'factory',
  level: 1,
  state: 'pending',
  missing,
})

const underwayFarm: TownGoal = {
  position: 1,
  count: 9,
  building: 'farm',
  level: 1,
  state: 'underway',
}

const caughtUp = (goal: TownGoal | null): NextStep => ({ kind: 'caughtUp', goal })

const townAt = (nextStep: NextStep, overrides: Partial<TownOverview> = {}): TownOverview => ({
  ...knownTown,
  nextStep,
  ...overrides,
})

const showTown = async (town: TownOverview, overrides: Partial<ApiClient> = {}): Promise<void> => {
  renderAppAt(
    '/',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      town: async () => ({ ok: true, value: town }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const card = (): HTMLElement => screen.getByRole('region', { name: townNextTitle() })

const factoryGoalLine = townGoalLine({ position: 2, count: 9, place: 'Fábrica', level: 1 })

it('shows the next goal', async () => {
  const missing = { resources: { money: 45, food: 0, power: 0, material: 65 }, people: 2 }

  await showTown(townAt(caughtUp(pendingFactory(missing))))

  const lines = within(card())
    .getAllByRole('paragraph')
    .map((line) => line.textContent)
  expect(lines).toContain(factoryGoalLine)
  expect(lines).toContain('Necesitas 45 de dinero y 65 de material más.')
  expect(lines).toContain(townGoalPeople({ count: 2 }))
})

it('shows a goal with nothing missing as ready', async () => {
  await showTown(townAt(caughtUp(pendingFactory(nothingMissing))))

  expect(within(card()).getByText(townGoalReady())).toBeDefined()
})

it('shows a goal underway as in work', async () => {
  await showTown(townAt(caughtUp(underwayFarm)))

  expect(
    within(card()).getByText(townGoalLine({ position: 1, count: 9, place: 'Granja', level: 1 })),
  ).toBeDefined()
  expect(within(card()).getByText(townInWork())).toBeDefined()
})

it('shows no goal beside any other next step', async () => {
  await showTown(townAt({ kind: 'reviews', count: 3, readFirst: [] }))

  expect(within(card()).queryByText(/Meta \d/)).toBeNull()
  expect(screen.queryByRole('button', { name: townGoalClose() })).toBeNull()
})

it('shows no goal once none is left', async () => {
  await showTown(townAt(caughtUp(null)))

  expect(within(card()).queryByText(/Meta \d/)).toBeNull()
  expect(screen.queryByRole('button', { name: townGoalClose() })).toBeNull()
})

it('keeps the Report the one ink pill beside the goal', async () => {
  await showTown(townAt(caughtUp(underwayFarm)))

  const pills = screen
    .getAllByRole('link')
    .filter((control) => control.getAttribute('data-tone') === 'primary')
  expect(pills.map((pill) => pill.textContent)).toEqual([townNextGoToReport()])
})

const heldAnswer = (): {
  readonly answer: Promise<ApiRefusal | undefined>
  readonly release: (refusal: ApiRefusal | undefined) => void
} => {
  let release: (refusal: ApiRefusal | undefined) => void = () => undefined
  const answer = new Promise<ApiRefusal | undefined>((resolve) => {
    release = resolve
  })
  return { answer, release }
}

const rereadOnce = async (): Promise<void> => {
  await passSeconds(60)
}

it('closes the goal at once and dismisses the guidance', async () => {
  const dismissGuidance = vi.fn(async (): Promise<ApiRefusal | undefined> => undefined)
  await showTown(townAt(caughtUp(underwayFarm)), { dismissGuidance })

  fireEvent.click(screen.getByRole('button', { name: townGoalClose() }))
  await passSeconds(0)

  expect(dismissGuidance).toHaveBeenCalledTimes(1)
  expect(within(card()).queryByText(townInWork())).toBeNull()
  expect(screen.queryByRole('button', { name: townGoalClose() })).toBeNull()
})

it('moves focus to the next step when the goal closes', async () => {
  await showTown(townAt(caughtUp(underwayFarm)))

  fireEvent.click(screen.getByRole('button', { name: townGoalClose() }))

  expect(document.activeElement?.textContent).toBe(townNextTitle())
})

it('keeps a closed goal hidden when a read still names it', async () => {
  const town = vi.fn(
    async (): Promise<ApiOutcome<TownOverview>> => ({
      ok: true,
      value: townAt(caughtUp(underwayFarm)),
    }),
  )
  await showTown(townAt(caughtUp(underwayFarm)), { town })

  fireEvent.click(screen.getByRole('button', { name: townGoalClose() }))
  await rereadOnce()

  expect(town).toHaveBeenCalledTimes(2)
  expect(within(card()).queryByText(townInWork())).toBeNull()
})

it('dismisses the guidance once on a double click', async () => {
  const held = heldAnswer()
  const dismissGuidance = vi.fn(() => held.answer)
  await showTown(townAt(caughtUp(underwayFarm)), { dismissGuidance })
  const close = screen.getByRole('button', { name: townGoalClose() })

  act(() => {
    fireEvent.click(close)
    fireEvent.click(close)
  })
  held.release(undefined)
  await passSeconds(0)

  expect(dismissGuidance).toHaveBeenCalledTimes(1)
})

it('dismisses the guidance again on the next read when the api could not be reached', async () => {
  const dismissGuidance = vi
    .fn(async (): Promise<ApiRefusal | undefined> => undefined)
    .mockResolvedValueOnce('Unexpected')
  await showTown(townAt(caughtUp(underwayFarm)), { dismissGuidance })

  fireEvent.click(screen.getByRole('button', { name: townGoalClose() }))
  await passSeconds(0)
  await rereadOnce()
  await rereadOnce()

  expect(dismissGuidance).toHaveBeenCalledTimes(2)
})

const tipLine = townTipWaitingList()

it('shows a tip once and never again after close', async () => {
  const markTipSeen = vi.fn(async (_tip: TipKind): Promise<ApiRefusal | undefined> => undefined)
  await showTown(townAt(caughtUp(null), { tip: 'waitingList' }), { markTipSeen })

  expect(screen.getByRole('region', { name: townTipTitle() })).toBeDefined()
  fireEvent.click(screen.getByRole('button', { name: townTipClose() }))
  await rereadOnce()

  expect(screen.queryByText(tipLine)).toBeNull()
  expect(markTipSeen.mock.calls).toEqual([['waitingList']])
})

it('closes a tip once on a double click', async () => {
  const held = heldAnswer()
  const markTipSeen = vi.fn((_tip: TipKind) => held.answer)
  await showTown(townAt(caughtUp(null), { tip: 'waitingList' }), { markTipSeen })
  const close = screen.getByRole('button', { name: townTipClose() })

  act(() => {
    fireEvent.click(close)
    fireEvent.click(close)
  })
  held.release(undefined)
  await passSeconds(0)

  expect(markTipSeen).toHaveBeenCalledTimes(1)
})

it('marks a tip seen again on the next read when the api could not be reached', async () => {
  const markTipSeen = vi
    .fn(async (_tip: TipKind): Promise<ApiRefusal | undefined> => undefined)
    .mockResolvedValueOnce('Unexpected')
  await showTown(townAt(caughtUp(null), { tip: 'waitingList' }), { markTipSeen })

  fireEvent.click(screen.getByRole('button', { name: townTipClose() }))
  await passSeconds(0)
  await rereadOnce()
  await rereadOnce()

  expect(markTipSeen.mock.calls).toEqual([['waitingList'], ['waitingList']])
})

it('sends no second close on a read while the first still waits', async () => {
  const held = heldAnswer()
  const markTipSeen = vi.fn((_tip: TipKind) => held.answer)
  await showTown(townAt(caughtUp(null), { tip: 'waitingList' }), { markTipSeen })

  fireEvent.click(screen.getByRole('button', { name: townTipClose() }))
  await rereadOnce()
  held.release('Unexpected')
  await passSeconds(0)

  expect(markTipSeen).toHaveBeenCalledTimes(1)
})

it.each<[TipKind, () => string]>([
  ['seasons', townStocks],
  ['waitingList', townWorkTitle],
  ['people', townPlacesTitleTown],
  ['office', namesPlacesOffice],
])('moves focus to the section a closed %s tip sat beside', async (tip, heading) => {
  await showTown(townAt(caughtUp(null), { tip }))

  fireEvent.click(screen.getByRole('button', { name: townTipClose() }))

  expect(document.activeElement?.textContent).toBe(heading())
})

it.each<[TipKind, () => string]>([
  ['people', townTipPeople],
  ['seasons', townTipSeasons],
  ['waitingList', townTipWaitingList],
  ['office', townTipOffice],
  ['jobs', townTipJobs],
  ['fullStore', townTipFullStore],
])('shows the %s tip by its own line', async (tip, line) => {
  await showTown(townAt(caughtUp(null), { tip }))

  const note = screen.getByRole('region', { name: townTipTitle() })
  expect(within(note).getByText(line())).toBeDefined()
})

it('shows no tip while the read names none', async () => {
  await showTown(townAt(caughtUp(null), { tip: null }))

  expect(screen.queryByRole('region', { name: townTipTitle() })).toBeNull()
})
