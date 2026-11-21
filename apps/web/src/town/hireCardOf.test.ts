import { townReadyIn } from '@mygame/catalog'
import type { TownOverview } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { knownTown } from '../auth/stubApiClient.testSupport'
import { lineLabelOf } from '../design-system/lineLabelOf'
import { hireCardOf } from './hireCardOf'
import { liveTownAt } from './liveTown'

const instantAfter = (seconds: number): string =>
  new Date(Date.parse(knownTown.readAt) + seconds * 1000).toISOString()

const hiringTown: TownOverview = {
  ...knownTown,
  buildings: { ...knownTown.buildings, office: { ...knownTown.buildings.office, level: 1 } },
  hiring: {
    ...knownTown.hiring,
    order: {
      hire: 'worker',
      count: 3,
      delivered: 1,
      secondsPerHire: 60,
      startedAt: instantAfter(-60),
      endsAt: instantAfter(120),
    },
  },
}

it('asks for a whole count before naming a running order', () => {
  const card = hireCardOf('worker', '', liveTownAt(hiringTown, 0))

  expect(card.kind === 'open' ? card.state : undefined).toEqual({
    kind: 'invalidEntry',
    reason: lineLabelOf('Contrata 1 o más.', 'es'),
  })
})

const shortOfMoneyTown: TownOverview = {
  ...hiringTown,
  stocks: {
    ...knownTown.stocks,
    money: { amount: 0, ratePerHour: 60, capacity: 5000, fullAt: null },
  },
  hiring: { ...knownTown.hiring, order: null },
}

const readyOf = (town: TownOverview, entry: string): string | undefined => {
  const card = hireCardOf('worker', entry, liveTownAt(town, 0))
  return card.kind === 'open' && card.state.kind === 'blocked' ? card.state.ready?.text : undefined
}

it('names the minute the money arrives when only resources are short', () => {
  expect(readyOf(shortOfMoneyTown, '1')).toBe(townReadyIn({ time: '40 min' }))
})

it('names no minute while a hiring order is open', () => {
  expect(readyOf({ ...shortOfMoneyTown, hiring: hiringTown.hiring }, '1')).toBeUndefined()
})

it('names no minute when people are short', () => {
  const town = { ...shortOfMoneyTown, people: { ...knownTown.people, free: 0 } }

  expect(readyOf(town, '1')).toBeUndefined()
})
