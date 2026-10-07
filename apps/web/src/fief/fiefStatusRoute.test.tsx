import type { FiefOverview, ProvinceMap } from '@mygame/contracts'
import { act, cleanup, fireEvent, screen, within } from '@testing-library/react'
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
import { servingOnceThenHolding } from './servingOnceThenHolding.testSupport'

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(knownFief.readAt) })
})

afterEach(() => {
  vi.useRealTimers()
})

const passSeconds = async (seconds: number): Promise<void> => {
  await act(() => vi.advanceTimersByTimeAsync(seconds * 1000))
}

const showAt = async (path: string, overrides: Partial<ApiClient> = {}): Promise<void> => {
  renderAppAt(path, stubApiClient({ currentPlayer: async () => knownPlayer, ...overrides }))
  await passSeconds(0)
}

const woodCell = (): HTMLElement | null =>
  screen.queryByRole('listitem', { name: copy.names.resources.wood })

it('shows the resource bar on the map and the chronicle', async () => {
  await showAt(`${knownFiefPath}/mapa`)
  expect(woodCell()).not.toBeNull()
  cleanup()

  await showAt(`${knownFiefPath}/cronica`)
  expect(woodCell()).not.toBeNull()
})

const fiefWithTenInfantry: FiefOverview = {
  ...knownFief,
  coordinates: { kingdom: 1, province: 1, plot: 1 },
  units: { infantry: 10, cavalry: 0, archer: 0, settler: 0 },
}

const ownProvince: ProvinceMap = {
  kingdom: 1,
  province: 1,
  lastProvince: 3,
  terrain: 'lowlands',
  plots: Array.from({ length: 15 }, (_, index) => ({
    plot: index + 1,
    fief: index === 0 ? { name: knownFief.name, isOwn: true } : null,
    camp: null,
    reservation: null,
  })),
}

const showOwnProvince = async (overrides: Partial<ApiClient> = {}): Promise<void> => {
  await showAt(`${knownFiefPath}/mapa`, {
    fief: async () => ({ ok: true, value: fiefWithTenInfantry }),
    provinceMap: async () => ({ ok: true, value: ownProvince }),
    ...overrides,
  })
}

it('reads the fief once for the bar and the map form', async () => {
  const fief = vi.fn<ApiClient['fief']>(async () => ({ ok: true, value: fiefWithTenInfantry }))
  await showOwnProvince({ fief })

  fireEvent.click(screen.getByRole('button', { name: copy.march.sendTo(2) }))

  expect(woodCell()).not.toBeNull()
  expect(screen.getByRole('form', { name: copy.march.title(1, 2) })).toBeDefined()
  expect(fief).toHaveBeenCalledTimes(1)
})

it('shows the answer of a dispatch from the map in the bar', async () => {
  const answered: FiefOverview = {
    ...fiefWithTenInfantry,
    resources: {
      ...fiefWithTenInfantry.resources,
      wood: { amount: 412, ratePerHour: 0, capacity: 20000, fullAt: null },
    },
  }
  await showOwnProvince({ dispatchMarch: async () => ({ ok: true, value: answered }) })
  fireEvent.click(screen.getByRole('button', { name: copy.march.sendTo(2) }))
  const form = screen.getByRole('form', { name: copy.march.title(1, 2) })

  fireEvent.click(within(form).getByRole('button', { name: /^Enviar una marcha/ }))
  await passSeconds(0)

  expect(woodCell()?.textContent).toContain('412')
})

const instantAfterRead = (seconds: number): string =>
  new Date(Date.parse(knownFief.readAt) + seconds * 1000).toISOString()

const withLevels = (library: number, barracks: number): FiefOverview['buildings'] => ({
  ...knownFief.buildings,
  library: { ...knownFief.buildings.library, level: library },
  barracks: { ...knownFief.buildings.barracks, level: barracks },
})

const fiefAtLevels = (library: number, barracks: number): FiefOverview => ({
  ...knownFief,
  buildings: withLevels(library, barracks),
})

const cargoOnItsWay: NonNullable<FiefOverview['incomingCargo']> = {
  fromFiefId: '6f1c2a5e-3b7d-4c8e-9a10-2b3c4d5e6f70',
  from: { name: 'Sotoverde', province: 3, plot: 12 },
  cargo: { wood: 300, stone: 0, iron: 0, gold: 0, food: 0 },
  departedAt: instantAfterRead(-60),
  arrivesAt: instantAfterRead(420),
}

const showFief = async (overview: FiefOverview): Promise<void> => {
  await showAt(knownFiefPath, { fief: async () => ({ ok: true, value: overview }) })
}

const strip = (): HTMLElement => screen.getByRole('region', { name: copy.status.label })

const slotLink = (name: RegExp): HTMLElement | null => within(strip()).queryByRole('link', { name })

const studySlot = /^(Sin estudio|Estudio:)/
const recruitSlot = /^(Sin leva|Leva:)/
const marchSlot = /^Sin marcha/
const cargoSlot = /^Carga en camino:/

it('hides the study slot below library level 1', async () => {
  await showFief(fiefAtLevels(0, 0))
  expect(slotLink(studySlot)).toBeNull()
  cleanup()

  await showFief(fiefAtLevels(1, 0))
  expect(slotLink(studySlot)).not.toBeNull()
})

it('hides the recruit and march slots below barracks level 1', async () => {
  await showFief(fiefAtLevels(0, 0))
  expect(slotLink(recruitSlot)).toBeNull()
  expect(slotLink(marchSlot)).toBeNull()
  cleanup()

  await showFief(fiefAtLevels(0, 1))
  expect(slotLink(recruitSlot)).not.toBeNull()
  expect(slotLink(marchSlot)).not.toBeNull()
})

it("fills the strip's cargo track with the time since the departure", async () => {
  await showAt(knownFiefPath, {
    fief: servingOnceThenHolding({
      ...knownFief,
      incomingCargo: {
        ...cargoOnItsWay,
        departedAt: instantAfterRead(-300),
        arrivesAt: instantAfterRead(600),
      },
    }),
  })

  await passSeconds(60)

  const track = within(slotLink(cargoSlot) as HTMLElement).getByRole('progressbar')
  expect(track.getAttribute('aria-valuenow')).toBe('40')
})

it('shows the cargo slot only while a cargo is on its way', async () => {
  await showFief(knownFief)
  expect(slotLink(cargoSlot)).toBeNull()
  cleanup()

  await showFief({ ...knownFief, incomingCargo: cargoOnItsWay })
  expect(slotLink(cargoSlot)?.textContent).toContain('desde Sotoverde')
})

it('links each slot to its section', async () => {
  await showFief({ ...fiefAtLevels(1, 1), incomingCargo: cargoOnItsWay })

  const links = within(strip()).getAllByRole('link')
  const sections = links.map((link) => new URL(link.getAttribute('href') ?? '', 'http://x').hash)
  expect(sections).toEqual(['#build', '#library', '#barracks', '#barracks', '#incoming-cargo'])
  for (const section of new Set(sections)) {
    expect(document.getElementById(section.slice(1))).not.toBeNull()
  }
})

const sawmillWithTwoWaiting: FiefOverview = {
  ...knownFief,
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    startedAt: instantAfterRead(-100),
    finishesAt: instantAfterRead(900),
  },
  queue: {
    entries: [
      {
        building: 'quarry',
        targetLevel: 2,
        startsAt: instantAfterRead(900),
        finishesAt: instantAfterRead(2040),
      },
      {
        building: 'farm',
        targetLevel: 2,
        startsAt: instantAfterRead(2040),
        finishesAt: instantAfterRead(4800),
      },
    ],
    cap: 4,
  },
}

it('counts the build slot down with the length of the queue', async () => {
  await showFief(sawmillWithTwoWaiting)

  const build = slotLink(/^Obra:/)
  expect(build?.textContent).toContain('Obra: aserradero, nivel 2 · 15 min')
  expect(build?.textContent).toContain('Obras en espera: 2')
  expect(
    within(build as HTMLElement)
      .getByRole('progressbar')
      .getAttribute('aria-valuenow'),
  ).toBe('10')
})

it('shows when the build queue empties', async () => {
  await showFief(sawmillWithTwoWaiting)

  expect(slotLink(/^Obra:/)?.textContent).toContain('Obras en espera: 2 · 1 h 20 min · 15:20')
  expect(screen.getByText(copy.names.buildQueue).parentElement?.textContent).toBe(
    'obras en espera · 1 h 20 min · 15:20',
  )
})

it('draws the time left and the clock as separate pieces', async () => {
  await showFief(sawmillWithTwoWaiting)

  const build = within(slotLink(/^Obra:/) as HTMLElement)
  expect(build.getByText('· 1 h 20 min')).toBeDefined()
  expect(build.getByText('· 15:20')).toBeDefined()
})

it('counts down and tracks the study, the levy and the march', async () => {
  await showFief({
    ...fiefAtLevels(1, 1),
    study: {
      kind: 'busy',
      art: 'smithing',
      targetLevel: 1,
      startedAt: instantAfterRead(-420),
      finishesAt: instantAfterRead(480),
    },
    units: { infantry: 17, cavalry: 0, archer: 0, settler: 0 },
    recruitOrder: {
      unit: 'infantry',
      count: 12,
      delivered: 5,
      perUnitSeconds: 34,
      startedAt: instantAfterRead(-170),
      endsAt: instantAfterRead(238),
    },
    march: {
      order: 'forage',
      province: 2,
      plot: 7,
      terrain: 'uplands',
      units: { infantry: 12, cavalry: 0, archer: 0, settler: 0 },
      stayHours: 2,
      departedAt: instantAfterRead(-600),
      oneWaySeconds: 900,
      loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
      arrivesAt: instantAfterRead(300),
      leavesAt: instantAfterRead(7500),
      returnsAt: instantAfterRead(8400),
      recalledAt: null,
      camp: null,
      fought: false,
    },
  })

  const lines = [/^Estudio:/, /^Leva:/, /^Marcha de ida:/].map(
    (name) => slotLink(name)?.textContent ?? '',
  )
  expect(lines).toEqual([
    'Estudio: herrería, nivel 1 · 8 min',
    'Leva: 5 de 12 infantes · 3 min',
    'Marcha de ida: 12 infantes a provincia 2, parcela 7 · 2 h 20 min · 16:20',
  ])
  const tracks = [/^Estudio:/, /^Leva:/, /^Marcha de ida:/].map((name) =>
    within(slotLink(name) as HTMLElement)
      .getByRole('progressbar')
      .getAttribute('aria-valuenow'),
  )
  expect(tracks).toEqual(['47', '42', '7'])
})

const stoneFillingAt = (secondsAfterRead: number): FiefOverview => ({
  ...knownFief,
  resources: {
    ...knownFief.resources,
    stone: {
      amount: 830,
      ratePerHour: 34,
      capacity: 1000,
      fullAt: instantAfterRead(secondsAfterRead),
    },
  },
})

const stoneCell = (): HTMLElement =>
  screen.getByRole('listitem', { name: copy.names.resources.stone })

it('reads lleno with the clock when the store fills within 8 hours', async () => {
  await showFief(stoneFillingAt(5 * 3600))

  expect(within(stoneCell()).getByText('lleno 19:00')).toBeDefined()
})

it('reads lleno with the clock when the store fills exactly 8 hours after the read', async () => {
  await showFief(stoneFillingAt(8 * 3600))

  expect(within(stoneCell()).getByText('lleno 22:00')).toBeDefined()
})

it('names tomorrow when the store fills after midnight', async () => {
  const readAtTenAtNight = '2026-09-22T20:00:00.000Z'
  await showFief({
    ...stoneFillingAt(13 * 3600),
    readAt: readAtTenAtNight,
  })

  expect(within(stoneCell()).getByText('lleno mañana 03:00')).toBeDefined()
})

it('keeps the rate when the store fills later than 8 hours', async () => {
  await showFief(stoneFillingAt(8 * 3600 + 60))

  expect(within(stoneCell()).getByText('+34 / h')).toBeDefined()
})

it('keeps the amounts on the map unchanged within a minute', async () => {
  const woodAtOnePerSecond: FiefOverview = {
    ...knownFief,
    resources: {
      ...knownFief.resources,
      wood: { amount: 1000, ratePerHour: 3600, capacity: 20000, fullAt: null },
    },
  }
  await showAt(`${knownFiefPath}/mapa`, {
    fief: servingOnceThenHolding(woodAtOnePerSecond),
  })

  await passSeconds(59)
  expect(within(woodCell() as HTMLElement).getByText('1 000')).toBeDefined()
  await passSeconds(1)

  expect(within(woodCell() as HTMLElement).getByText('1 060')).toBeDefined()
})
