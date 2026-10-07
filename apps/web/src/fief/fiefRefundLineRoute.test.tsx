import type { FiefOverview } from '@mygame/contracts'
import { act, screen, within } from '@testing-library/react'
import { afterEach, assert, beforeEach, expect, it, vi } from 'vitest'
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

const showFief = async (overview: FiefOverview): Promise<void> => {
  renderAppAt(
    knownFiefPath,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: async () => ({ ok: true, value: overview }),
    }),
  )
  await act(() => vi.advanceTimersByTimeAsync(0))
}

const lineBesideCancel = (cancelName: string, line: string): HTMLElement => {
  const cancel = screen.getByRole('button', { name: cancelName })
  expect(cancel.textContent).not.toContain(line)
  const row = cancel.parentElement
  assert(row !== null)
  return within(row).getByText(line)
}

const sawmillWithQuarryWaiting: FiefOverview = {
  ...knownFief,
  slot: {
    kind: 'busy',
    building: 'sawmill',
    targetLevel: 2,
    startedAt: '2026-09-22T11:59:00.000Z',
    finishesAt: '2026-09-22T12:03:12.000Z',
  },
  queue: {
    entries: [
      {
        building: 'quarry',
        targetLevel: 2,
        startsAt: '2026-09-22T12:03:12.000Z',
        finishesAt: '2026-09-22T12:06:24.000Z',
      },
    ],
    cap: 4,
  },
}

const upgradeRefund =
  'Si la cancelas, recuperas todo lo que costó, y lo mismo por cada obra en espera que caiga con ella.'

it('states the refund of an upgrade beside its cancel', async () => {
  await showFief(sawmillWithQuarryWaiting)

  expect(lineBesideCancel(copy.fief.cancelOf('sawmill', 2), upgradeRefund)).toBeDefined()
})

it('states the refund of a waiting upgrade beside its cancel', async () => {
  await showFief(sawmillWithQuarryWaiting)

  expect(lineBesideCancel(copy.fief.cancelOf('quarry', 2), upgradeRefund)).toBeDefined()
})

const smithingStudied: FiefOverview = {
  ...knownFief,
  buildings: { ...knownFief.buildings, library: { ...knownFief.buildings.library, level: 1 } },
  study: {
    kind: 'busy',
    art: 'smithing',
    targetLevel: 1,
    startedAt: '2026-09-22T11:50:00.000Z',
    finishesAt: '2026-09-22T12:20:00.000Z',
  },
}

it('states the stored cost of a study beside its cancel', async () => {
  await showFief(smithingStudied)

  expect(
    lineBesideCancel(
      copy.study.cancelOf('smithing', 1),
      'Si lo cancelas, recuperas 120 de madera, 80 de piedra, 150 de hierro y 60 de oro.',
    ),
  ).toBeDefined()
})

const infantryLevyWithSevenToCome: FiefOverview = {
  ...knownFief,
  buildings: { ...knownFief.buildings, barracks: { ...knownFief.buildings.barracks, level: 1 } },
  units: { ...knownFief.units, infantry: 5 },
  recruitOrder: {
    unit: 'infantry',
    count: 12,
    delivered: 5,
    perUnitSeconds: 30,
    startedAt: '2026-09-22T11:57:30.000Z',
    endsAt: '2026-09-22T12:03:30.000Z',
  },
}

it('states the cost of the undelivered units beside a levy cancel', async () => {
  await showFief(infantryLevyWithSevenToCome)

  expect(
    lineBesideCancel(
      copy.army.cancelOf('infantry', 12),
      'Si la cancelas, recuperas lo de 7 infantes de vuelta al campo: 140 de madera, 70 de hierro y 210 de comida.',
    ),
  ).toBeDefined()
})

it('counts down the refunded units as the levy delivers them', async () => {
  await showFief(infantryLevyWithSevenToCome)

  await act(() => vi.advanceTimersByTimeAsync(30_000))

  expect(
    lineBesideCancel(
      copy.army.cancelOf('infantry', 12),
      'Si la cancelas, recuperas lo de 6 infantes de vuelta al campo: 120 de madera, 60 de hierro y 180 de comida.',
    ),
  ).toBeDefined()
})

const infantryLevyAllDelivered: FiefOverview = {
  ...infantryLevyWithSevenToCome,
  units: { ...knownFief.units, infantry: 12 },
  recruitOrder: {
    unit: 'infantry',
    count: 12,
    delivered: 12,
    perUnitSeconds: 30,
    startedAt: '2026-09-22T11:54:00.000Z',
    endsAt: '2026-09-22T12:00:00.000Z',
  },
}

it('states no refund beside a levy cancel once every unit is delivered', async () => {
  renderAppAt(
    knownFiefPath,
    stubApiClient({
      currentPlayer: async () => knownPlayer,
      fief: (() => {
        const reads = [infantryLevyAllDelivered]
        return () => {
          const next = reads.shift()
          return next === undefined
            ? new Promise(() => undefined)
            : Promise.resolve({ ok: true as const, value: next })
        }
      })(),
    }),
  )
  await act(() => vi.advanceTimersByTimeAsync(0))

  const cancel = screen.getByRole('button', { name: copy.army.cancelOf('infantry', 12) })
  const row = cancel.parentElement
  assert(row !== null)
  expect(within(row).queryByText(/recuperas/)).toBeNull()
})
