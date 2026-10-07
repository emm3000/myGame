import type { FiefOverview } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { knownFief } from '../auth/stubApiClient.testSupport'
import { finishNoticesOf } from './finishNoticesOf'

const rereadAt = '2026-09-22T12:10:00.000Z'

const rereadOf = (overview: FiefOverview): FiefOverview => ({ ...overview, readAt: rereadAt })

const bodiesBetween = (previous: FiefOverview, next: FiefOverview): ReadonlyArray<string> =>
  finishNoticesOf(previous, next).map((notice) => notice.body)

type AnsweredMarch = NonNullable<FiefOverview['march']>

const forageAway: AnsweredMarch = {
  order: 'forage',
  province: 2,
  plot: 7,
  terrain: 'uplands',
  units: { infantry: 12, cavalry: 0, archer: 0, settler: 0 },
  stayHours: 1,
  departedAt: '2026-09-22T10:00:00.000Z',
  oneWaySeconds: 840,
  loot: { wood: 200, stone: 0, iron: 0, gold: 0, food: 0 },
  arrivesAt: '2026-09-22T10:14:00.000Z',
  leavesAt: '2026-09-22T11:14:00.000Z',
  returnsAt: '2026-09-22T12:05:00.000Z',
  recalledAt: null,
  camp: null,
  fought: false,
}

const withMarch = (march: AnsweredMarch): FiefOverview => ({ ...knownFief, march })

it('reads a finished study as the roll does', () => {
  const studying: FiefOverview = {
    ...knownFief,
    study: {
      kind: 'busy',
      art: 'smithing',
      targetLevel: 2,
      startedAt: '2026-09-22T11:00:00.000Z',
      finishesAt: '2026-09-22T12:05:00.000Z',
    },
  }
  const learned = rereadOf({
    ...knownFief,
    arts: { ...knownFief.arts, smithing: { ...knownFief.arts.smithing, level: 2 } },
  })

  expect(bodiesBetween(studying, learned)).toEqual(['Estudio terminado: herrería, nivel 2.'])
})

it('reads a finished levy as the roll does', () => {
  const levying: FiefOverview = {
    ...knownFief,
    recruitOrder: {
      unit: 'infantry',
      count: 12,
      delivered: 10,
      perUnitSeconds: 30,
      startedAt: '2026-09-22T11:59:00.000Z',
      endsAt: '2026-09-22T12:05:00.000Z',
    },
  }

  const delivered = rereadOf({ ...knownFief, units: { ...knownFief.units, infantry: 2 } })

  expect(bodiesBetween(levying, delivered)).toEqual(['Leva terminada: 12 infantes.'])
})

it('sends nothing for a levy cancelled elsewhere just before its end', () => {
  const levying: FiefOverview = {
    ...knownFief,
    recruitOrder: {
      unit: 'infantry',
      count: 12,
      delivered: 10,
      perUnitSeconds: 30,
      startedAt: '2026-09-22T11:59:00.000Z',
      endsAt: '2026-09-22T12:05:00.000Z',
    },
  }
  const cancelled = rereadOf({ ...knownFief, units: { ...knownFief.units, infantry: 1 } })

  expect(bodiesBetween(levying, cancelled)).toEqual([])
})

it('reads a march back as the roll does', () => {
  expect(bodiesBetween(withMarch(forageAway), rereadOf(knownFief))).toEqual([
    'Marcha terminada: provincia 2, parcela 7, 12 infantes.',
  ])
})

it('reads a recalled march back as the roll does', () => {
  const recalled = withMarch({ ...forageAway, recalledAt: '2026-09-22T10:10:00.000Z' })

  expect(bodiesBetween(recalled, rereadOf(knownFief))).toEqual([
    'Marcha retirada: provincia 2, parcela 7, 12 infantes.',
  ])
})

it('sends nothing for a recall the lord made', () => {
  const outbound = withMarch({ ...forageAway, returnsAt: '2026-09-22T12:30:00.000Z' })
  const recalled = rereadOf(
    withMarch({
      ...forageAway,
      recalledAt: '2026-09-22T12:09:00.000Z',
      returnsAt: '2026-09-22T12:20:00.000Z',
    }),
  )

  expect(bodiesBetween(outbound, recalled)).toEqual([])
})

it('reads a founding as the roll does', () => {
  const founding = withMarch({
    ...forageAway,
    order: 'found',
    name: 'Sotoverde del Páramo',
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
    stayHours: 0,
    loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
    arrivesAt: '2026-09-22T12:05:00.000Z',
    leavesAt: '2026-09-22T12:05:00.000Z',
    returnsAt: '2026-09-22T12:19:00.000Z',
  })

  expect(bodiesBetween(founding, rereadOf(knownFief))).toEqual([
    'Feudo fundado: Sotoverde del Páramo, provincia 2, parcela 7.',
  ])
})

const attackOnTheWay = withMarch({
  ...forageAway,
  order: 'attack',
  stayHours: 0,
  camp: { tier: 2, strength: 40 },
  arrivesAt: '2026-09-22T12:05:00.000Z',
  leavesAt: '2026-09-22T12:05:00.000Z',
  returnsAt: '2026-09-22T12:08:00.000Z',
})

it('sends nothing for a lost attack, which no one comes back from', () => {
  const beforeTheReturn = { ...knownFief, readAt: '2026-09-22T12:06:00.000Z' }

  expect(bodiesBetween(attackOnTheWay, beforeTheReturn)).toEqual([])
})

it('sends nothing for an attack whose battle and return fall between two reads', () => {
  expect(bodiesBetween(attackOnTheWay, rereadOf(knownFief))).toEqual([])
})

it('sends nothing for a founding whose arrival and return fall between two reads', () => {
  const foundingOnTheWay = withMarch({
    ...forageAway,
    order: 'found',
    name: 'Sotoverde del Páramo',
    units: { infantry: 0, cavalry: 0, archer: 0, settler: 1 },
    stayHours: 0,
    loot: { wood: 0, stone: 0, iron: 0, gold: 0, food: 0 },
    arrivesAt: '2026-09-22T12:02:00.000Z',
    leavesAt: '2026-09-22T12:02:00.000Z',
    returnsAt: '2026-09-22T12:08:00.000Z',
  })

  expect(bodiesBetween(foundingOnTheWay, rereadOf(knownFief))).toEqual([])
})

const awaitingCargo: FiefOverview = {
  ...knownFief,
  incomingCargo: {
    fromFiefId: '7f1c0a52-4a35-4c3e-9d55-2b9c5f0e8a11',
    from: { name: 'Sotoverde', province: 3, plot: 12 },
    cargo: { wood: 300, stone: 0, iron: 0, gold: 0, food: 0 },
    departedAt: '2026-09-22T12:00:00.000Z',
    arrivesAt: '2026-09-22T12:05:00.000Z',
  },
}

it('reads a cargo arrived as the roll does', () => {
  const credited = rereadOf({
    ...knownFief,
    resources: {
      ...knownFief.resources,
      wood: { ...knownFief.resources.wood, amount: knownFief.resources.wood.amount + 300 },
    },
  })

  expect(bodiesBetween(awaitingCargo, credited)).toEqual([
    'Transporte recibido: Sotoverde, provincia 3, parcela 12.',
  ])
})

it('sends nothing for a cargo recalled elsewhere just before its arrival', () => {
  expect(bodiesBetween(awaitingCargo, rereadOf(knownFief))).toEqual([])
})

it('reads every upgrade the queue finished between two reads', () => {
  const twoUpgradesQueued: FiefOverview = {
    ...knownFief,
    slot: {
      kind: 'busy',
      building: 'sawmill',
      targetLevel: 2,
      startedAt: '2026-09-22T11:50:00.000Z',
      finishesAt: '2026-09-22T12:02:00.000Z',
    },
    queue: {
      entries: [
        {
          building: 'quarry',
          targetLevel: 1,
          startsAt: '2026-09-22T12:02:00.000Z',
          finishesAt: '2026-09-22T12:06:00.000Z',
        },
      ],
      cap: 4,
    },
  }
  const bothBuilt = rereadOf({
    ...knownFief,
    buildings: {
      ...knownFief.buildings,
      sawmill: { ...knownFief.buildings.sawmill, level: 2 },
      quarry: { ...knownFief.buildings.quarry, level: 1 },
    },
  })

  expect(bodiesBetween(twoUpgradesQueued, bothBuilt)).toEqual([
    'Obra terminada: aserradero, nivel 2.',
    'Obra terminada: cantera, nivel 1.',
  ])
})

it('titles each notice with the fief name', () => {
  const titles = finishNoticesOf(withMarch(forageAway), rereadOf(knownFief)).map(
    (notice) => notice.title,
  )

  expect(titles).toEqual(['Fuenteclara'])
})
