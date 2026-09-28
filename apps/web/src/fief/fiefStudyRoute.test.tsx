import type { ArtKind, FiefOverview } from '@mygame/contracts'
import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ApiClient, ApiOutcome } from '../api/apiClient'
import { renderAppAt } from '../auth/renderAppAt.testSupport'
import { knownFief, knownPlayer, stubApiClient } from '../auth/stubApiClient.testSupport'
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

const libraryBuilt: FiefOverview = {
  ...knownFief,
  buildings: {
    ...knownFief.buildings,
    library: { ...knownFief.buildings.library, level: 1 },
  },
}

const smithingUnderWay: FiefOverview = {
  ...libraryBuilt,
  resources: {
    ...libraryBuilt.resources,
    iron: { ...libraryBuilt.resources.iron, amount: 150 },
  },
  study: {
    kind: 'busy',
    art: 'smithing',
    targetLevel: 1,
    startedAt: '2026-09-22T11:50:00.000Z',
    finishesAt: '2026-09-22T12:20:00.000Z',
  },
}

const showFief = async (overrides: Partial<ApiClient>): Promise<void> => {
  renderAppAt(
    '/',
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: libraryBuilt }),
      ...overrides,
    }),
  )
  await passSeconds(0)
}

const librarySection = (): HTMLElement => screen.getByRole('region', { name: copy.study.section })

const artCard = (art: ArtKind): HTMLElement =>
  within(librarySection()).getByRole('listitem', { name: copy.names.arts[art] })

const studyButtonOf = (art: ArtKind): HTMLElement => within(artCard(art)).getByRole('button')

interface Deferred<T> {
  readonly promise: Promise<T>
  readonly resolve: (value: T) => void
}

const deferred = <T,>(): Deferred<T> => {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

it('hides the library section while the library is unbuilt', async () => {
  await showFief({ fief: async () => ({ ok: true, value: knownFief }) })

  expect(screen.queryByRole('region', { name: copy.study.section })).toBeNull()
})

it('shows the idle study slot and a card per art once the library stands', async () => {
  await showFief({})

  expect(within(librarySection()).getByText(copy.names.idleStudy)).toBeDefined()
  expect(within(artCard('smithing')).getByText('Herrería')).toBeDefined()
  expect(within(artCard('masonry')).getByText('Cantería')).toBeDefined()
})

it('shows on an art card its level, effect, cost, duration and library requirement', async () => {
  await showFief({})

  const card = artCard('smithing')
  expect(within(card).getByText('sin estudiar')).toBeDefined()
  expect(within(card).getByText('+0 % de hierro / h · nivel 1: +5 %')).toBeDefined()
  expect(within(card).getByText('150')).toBeDefined()
  expect(within(card).getByText('Requiere biblioteca a nivel 1')).toBeDefined()
  expect(studyButtonOf('smithing').textContent).toBe('Estudiar · 30:00')
})

it('starts a study from an art card', async () => {
  const startStudy = vi.fn(async () => ({ ok: true as const, value: smithingUnderWay }))
  await showFief({ startStudy })

  fireEvent.click(studyButtonOf('smithing'))
  await passSeconds(0)

  expect(startStudy).toHaveBeenCalledWith('smithing')
  expect(
    within(librarySection()).getByRole('button', { name: copy.study.cancelOf('smithing', 1) }),
  ).toBeDefined()
})

it('studies at most once on a double click', async () => {
  const answer = deferred<ApiOutcome<FiefOverview>>()
  const startStudy = vi.fn(() => answer.promise)
  await showFief({ startStudy })

  const smithingButton = studyButtonOf('smithing')
  act(() => {
    smithingButton.click()
    smithingButton.click()
  })
  answer.resolve({ ok: true, value: smithingUnderWay })
  await passSeconds(0)

  expect(startStudy).toHaveBeenCalledTimes(1)
})

it('disables every study button while a study runs', async () => {
  await showFief({ fief: async () => ({ ok: true, value: smithingUnderWay }) })

  expect(studyButtonOf('smithing').getAttribute('aria-label')).toBe(
    'Estudiar · 30:00. Ya hay un estudio en marcha.',
  )
  expect(studyButtonOf('masonry').hasAttribute('disabled')).toBe(true)
  expect(within(artCard('masonry')).getByText('Ya hay un estudio en marcha.')).toBeDefined()
})

it('names the library level an art still requires', async () => {
  const smithingNeedsMore: FiefOverview = {
    ...libraryBuilt,
    arts: {
      ...libraryBuilt.arts,
      smithing: {
        level: 2,
        ratePercent: 10,
        nextLevel: {
          level: 3,
          cost: { wood: 1, stone: 1, iron: 1, gold: 1, food: 0 },
          durationSeconds: 1152,
          requiredLibraryLevel: 2,
          ratePercent: 15,
        },
      },
    },
  }
  await showFief({ fief: async () => ({ ok: true, value: smithingNeedsMore }) })

  expect(studyButtonOf('smithing').hasAttribute('disabled')).toBe(true)
  expect(studyButtonOf('smithing').getAttribute('aria-label')).toBe(
    'Estudiar · 19:12. Necesitas la biblioteca a nivel 2 y está a nivel 1.',
  )
})

it('names the resources a study still lacks', async () => {
  const shortOfGold: FiefOverview = {
    ...libraryBuilt,
    resources: {
      ...libraryBuilt.resources,
      gold: { ...libraryBuilt.resources.gold, amount: 20, ratePerHour: 0 },
    },
  }
  await showFief({ fief: async () => ({ ok: true, value: shortOfGold }) })

  expect(studyButtonOf('smithing').hasAttribute('disabled')).toBe(true)
  expect(studyButtonOf('smithing').getAttribute('aria-label')).toBe(
    'Estudiar · 30:00. Te faltan 40 de oro.',
  )
})

it('enables a study once the interpolated amounts cover its cost', async () => {
  const goldArriving: FiefOverview = {
    ...libraryBuilt,
    resources: {
      ...libraryBuilt.resources,
      gold: { ...libraryBuilt.resources.gold, amount: 59, ratePerHour: 3600 },
    },
  }
  await showFief({ fief: async () => ({ ok: true, value: goldArriving }) })

  await passSeconds(1)

  expect(studyButtonOf('smithing').hasAttribute('disabled')).toBe(false)
})

const smithingNeedsLibraryTwo: FiefOverview['arts']['smithing'] = {
  level: 2,
  ratePercent: 10,
  nextLevel: {
    level: 3,
    cost: { wood: 270, stone: 180, iron: 338, gold: 135, food: 0 },
    durationSeconds: 1152,
    requiredLibraryLevel: 2,
    ratePercent: 15,
  },
}

it('names the running study before the library an art still requires', async () => {
  const masonryUnderWay: FiefOverview = {
    ...libraryBuilt,
    arts: { ...libraryBuilt.arts, smithing: smithingNeedsLibraryTwo },
    study: {
      kind: 'busy',
      art: 'masonry',
      targetLevel: 1,
      startedAt: '2026-09-22T11:50:00.000Z',
      finishesAt: '2026-09-22T12:20:00.000Z',
    },
  }
  await showFief({ fief: async () => ({ ok: true, value: masonryUnderWay }) })

  expect(studyButtonOf('smithing').getAttribute('aria-label')).toBe(
    'Estudiar · 19:12. Ya hay un estudio en marcha.',
  )
})

it('names the library level before the resources a study lacks', async () => {
  const shortOfGoldAndLibrary: FiefOverview = {
    ...libraryBuilt,
    resources: {
      ...libraryBuilt.resources,
      gold: { ...libraryBuilt.resources.gold, amount: 20, ratePerHour: 0 },
    },
    arts: { ...libraryBuilt.arts, smithing: smithingNeedsLibraryTwo },
  }
  await showFief({ fief: async () => ({ ok: true, value: shortOfGoldAndLibrary }) })

  expect(studyButtonOf('smithing').getAttribute('aria-label')).toBe(
    'Estudiar · 19:12. Necesitas la biblioteca a nivel 2 y está a nivel 1.',
  )
})

it('shows an art at its top level as finished while a study runs', async () => {
  const smithingAtTopWhileMasonryRuns: FiefOverview = {
    ...libraryBuilt,
    arts: { ...libraryBuilt.arts, smithing: { level: 10, ratePercent: 50, nextLevel: null } },
    study: {
      kind: 'busy',
      art: 'masonry',
      targetLevel: 1,
      startedAt: '2026-09-22T11:50:00.000Z',
      finishesAt: '2026-09-22T12:20:00.000Z',
    },
  }
  await showFief({ fief: async () => ({ ok: true, value: smithingAtTopWhileMasonryRuns }) })

  expect(studyButtonOf('smithing').textContent).toBe('Nivel máximo')
  expect(within(artCard('smithing')).queryByText('Ya hay un estudio en marcha.')).toBeNull()
})

it('shows an art at its top level as finished', async () => {
  const smithingAtTop: FiefOverview = {
    ...libraryBuilt,
    arts: { ...libraryBuilt.arts, smithing: { level: 10, ratePercent: 50, nextLevel: null } },
  }
  await showFief({ fief: async () => ({ ok: true, value: smithingAtTop }) })

  expect(studyButtonOf('smithing').textContent).toBe('Nivel máximo')
  expect(studyButtonOf('smithing').hasAttribute('disabled')).toBe(true)
  expect(
    within(artCard('smithing')).getByText('+50 % de hierro / h · Ya está en su nivel más alto.'),
  ).toBeDefined()
})

it('counts down the study in progress between reads', async () => {
  await showFief({ fief: async () => ({ ok: true, value: smithingUnderWay }) })

  await passSeconds(5)

  expect(within(librarySection()).getByRole('timer').textContent).toBe('19:55')
})

it('re-reads the fief when the study finishes', async () => {
  const smithingNearlyDone: FiefOverview = {
    ...smithingUnderWay,
    study: {
      kind: 'busy',
      art: 'smithing',
      targetLevel: 1,
      startedAt: '2026-09-22T11:30:30.000Z',
      finishesAt: '2026-09-22T12:00:30.000Z',
    },
  }
  const fief = vi.fn(async () => ({ ok: true as const, value: smithingNearlyDone }))
  await showFief({ fief })

  await passSeconds(29)
  expect(fief).toHaveBeenCalledTimes(1)
  await passSeconds(1)

  expect(fief).toHaveBeenCalledTimes(2)
})

it('cancels the study in progress', async () => {
  const cancelStudy = vi.fn(async () => ({ ok: true as const, value: libraryBuilt }))
  await showFief({ fief: async () => ({ ok: true, value: smithingUnderWay }), cancelStudy })

  fireEvent.click(
    within(librarySection()).getByRole('button', { name: copy.study.cancelOf('smithing', 1) }),
  )
  await passSeconds(0)

  expect(cancelStudy).toHaveBeenCalledWith({ art: 'smithing', targetLevel: 1 })
  expect(within(librarySection()).getByText(copy.names.idleStudy)).toBeDefined()
})

it('shows the Spanish reason when the study finished before the cancel', async () => {
  const cancelStudy = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: false,
    refusal: 'StudyNotFound',
  })
  await showFief({ fief: async () => ({ ok: true, value: smithingUnderWay }), cancelStudy })

  fireEvent.click(
    within(librarySection()).getByRole('button', { name: copy.study.cancelOf('smithing', 1) }),
  )
  await passSeconds(0)

  expect(within(librarySection()).getByRole('alert').textContent).toBe(
    'La biblioteca ya no tiene ese estudio en marcha. No queda nada que cancelar.',
  )
})

it('clears a study refusal once a fresh read of the fief arrives', async () => {
  const cancelStudy = async (): Promise<ApiOutcome<FiefOverview>> => ({
    ok: false,
    refusal: 'StudyNotFound',
  })
  const reads = [smithingUnderWay, { ...libraryBuilt, readAt: '2026-09-22T12:01:00.000Z' }]
  await showFief({
    fief: async () => ({ ok: true, value: reads.shift() ?? libraryBuilt }),
    cancelStudy,
  })

  fireEvent.click(
    within(librarySection()).getByRole('button', { name: copy.study.cancelOf('smithing', 1) }),
  )
  await passSeconds(60)

  expect(within(librarySection()).queryByRole('alert')).toBeNull()
})
