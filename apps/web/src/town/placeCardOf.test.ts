import { es } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { knownTown } from '../auth/stubApiClient.testSupport'
import { playerCopyOf } from '../copy/playerCopyOf'
import type { CardActionState } from '../design-system/CardAction'
import { liveTownAt } from './liveTown'
import { placeCardOf } from './placeCardOf'

const spanishCopy = playerCopyOf({ scaffold: 'es', chromePhase: 'scaffold' })

type Stock = TownOverview['stocks']['material']

const stockOf = (amount: number, ratePerHour: number, capacity = 5000): Stock => ({
  amount,
  ratePerHour,
  capacity,
  fullAt: null,
})

const townWith = (stocks: Partial<TownOverview['stocks']>): TownOverview => ({
  ...knownTown,
  stocks: { ...knownTown.stocks, ...stocks },
})

const readyOf = (town: TownOverview, elapsedSeconds = 0): string | undefined => {
  const state: CardActionState = placeCardOf(
    spanishCopy,
    'farm',
    liveTownAt(town, elapsedSeconds),
  ).state
  return state.kind === 'blocked' ? state.ready?.text : undefined
}

it('names the minutes left when only resources are short and arrive within the hour', () => {
  expect(readyOf(townWith({ material: stockOf(0, 90) }))).toBe(es.townReadyIn({ time: '54 min' }))
})

it('names the latest minute across the short resources', () => {
  const town = townWith({ money: stockOf(0, 60), material: stockOf(0, 90) })

  expect(readyOf(town)).toBe(es.townReadyAt({ time: '11:00' }))
})

it('counts the minutes left down from the live read', () => {
  expect(readyOf(townWith({ material: stockOf(0, 90) }), 600)).toBe(
    es.townReadyIn({ time: '44 min' }),
  )
})

it('names the clock the resources arrive at from an hour on', () => {
  expect(readyOf(townWith({ material: stockOf(0, 30) }))).toBe(es.townReadyAt({ time: '12:40' }))
})

it('names tomorrow when the resources arrive past midnight', () => {
  expect(readyOf(townWith({ material: stockOf(0, 5) }))).toBe(
    es.townReadyAt({ time: es.statusTomorrow({ time: '02:00' }) }),
  )
})

it('rounds a read carrying seconds up to the next whole minute', () => {
  const town = { ...townWith({ material: stockOf(0, 30) }), readAt: '2026-11-10T09:00:30.000Z' }

  expect(readyOf(town)).toBe(es.townReadyAt({ time: '12:41' }))
})

it('names no minute for a short resource with a rate of 0', () => {
  expect(readyOf(townWith({ money: stockOf(0, 0), material: stockOf(0, 90) }))).toBeUndefined()
})

it('names no minute for a cost above the capacity', () => {
  expect(readyOf(townWith({ material: stockOf(0, 90, 50) }))).toBeUndefined()
})

it('names no minute when people are short', () => {
  const town = {
    ...townWith({ material: stockOf(0, 90) }),
    people: { ...knownTown.people, free: 1 },
  }

  expect(readyOf(town)).toBeUndefined()
})

it('names no minute when the waiting list is full', () => {
  const work: TownOverview['work']['waitingList'][number] = {
    building: 'homes',
    level: 2,
    cost: { money: 0, food: 0, power: 0, material: 0 },
    startsAt: knownTown.readAt,
    finishesAt: '2026-11-10T09:30:00.000Z',
  }
  const town: TownOverview = {
    ...townWith({ material: stockOf(0, 90) }),
    work: { ...knownTown.work, slot: work, waitingList: [work, work] },
  }

  expect(readyOf(town)).toBeUndefined()
})
