import type { TownOverview } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { knownTown } from '../auth/stubApiClient.testSupport'
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

it('names the count before a running order when the count is not a whole count', () => {
  const card = hireCardOf('worker', '', liveTownAt(hiringTown, 0))

  expect(card.kind === 'open' ? card.state : undefined).toEqual({
    kind: 'blocked',
    reason: 'Contrata 1 o más.',
  })
})
