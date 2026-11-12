import { assert, describe, expect, it } from 'vitest'
import { plainTownSettings, townCatalogOf } from '../testing/townCatalogOf'
import { type TownShape, townOf } from '../testing/townFixtures'
import { Instant } from '../time/Instant'
import type { BusyWorkSlot } from './BuildingWork'
import type { TipKind } from './TipKind'
import type { TownSettings } from './TownSettings'
import { type TipReading, tipOf } from './tipOf'

const storedAt = Instant.fromEpochMilliseconds(plainTownSettings.seasons.epoch.epochMilliseconds)

const readAt = Instant.fromEpochMilliseconds(storedAt.epochMilliseconds + 3_600_000)

const noCost = { money: 0, food: 0, power: 0, material: 0 }

const busyFarmWork: BusyWorkSlot = {
  kind: 'busy',
  building: 'farm',
  level: 1,
  cost: noCost,
  startedAt: storedAt,
  finishesAt: Instant.fromEpochMilliseconds(readAt.epochMilliseconds + 60_000),
}

const catalogWith = (tips: ReadonlyArray<TipKind>, settings: Partial<TownSettings> = {}) =>
  townCatalogOf({ ...plainTownSettings, ...settings, tips })

const readingOf = (
  town: Partial<TownShape> = {},
  seenTips: ReadonlyArray<TipKind> = [],
): TipReading => ({ town: townOf({ storedAt, ...town }), at: readAt, seenTips })

const shownTip = (reading: TipReading, catalog = catalogWith(['waitingList'])) => {
  const tip = tipOf(reading, catalog)
  assert(tip.ok)
  return tip.value
}

describe('tipOf', () => {
  it('shows a tip the first time its concept matters', () => {
    expect(shownTip(readingOf({ workSlot: busyFarmWork }))).toBe('waitingList')
  })

  it('shows no tip while its concept does not matter', () => {
    expect(shownTip(readingOf())).toBeUndefined()
  })

  it('never shows a seen tip again', () => {
    expect(shownTip(readingOf({ workSlot: busyFarmWork }, ['waitingList']))).toBeUndefined()
  })

  it('shows no tip the content does not list', () => {
    expect(shownTip(readingOf({ workSlot: busyFarmWork }), catalogWith([]))).toBeUndefined()
  })

  it('shows the first unseen tip in the content order', () => {
    const reading = readingOf({ workSlot: busyFarmWork, buildingLevels: { office: 1 } })

    expect([
      shownTip(reading, catalogWith(['office', 'waitingList'])),
      shownTip(reading, catalogWith(['waitingList', 'office'])),
    ]).toEqual(['office', 'waitingList'])
  })

  it('shows the office tip once the office is built', () => {
    expect(shownTip(readingOf({ buildingLevels: { office: 1 } }), catalogWith(['office']))).toBe(
      'office',
    )
  })

  it('shows no office tip before the office is built', () => {
    expect(shownTip(readingOf(), catalogWith(['office']))).toBeUndefined()
  })

  it('shows the people tip once a next level needs more people than are free', () => {
    const reading = readingOf({ hires: { worker: 25, truck: 0 } })

    expect(shownTip(reading, catalogWith(['people']))).toBe('people')
  })

  it('shows no people tip while every next level can be staffed', () => {
    expect(shownTip(readingOf(), catalogWith(['people']))).toBeUndefined()
  })

  it('shows the seasons tip while the season changes a production', () => {
    const { seasons } = plainTownSettings
    const springFood = { ...seasons.productionPercent.spring, food: 120 }
    const catalog = catalogWith(['seasons'], {
      seasons: {
        ...seasons,
        productionPercent: { ...seasons.productionPercent, spring: springFood },
      },
    })

    expect(shownTip(readingOf(), catalog)).toBe('seasons')
  })

  it('shows no seasons tip while the season changes no production', () => {
    expect(shownTip(readingOf(), catalogWith(['seasons']))).toBeUndefined()
  })

  it('shows the jobs tip while a hire is at home', () => {
    const reading = readingOf({ hires: { worker: 1, truck: 0 } })

    expect(shownTip(reading, catalogWith(['jobs']))).toBe('jobs')
  })

  it('shows no jobs tip while the town holds no hire', () => {
    expect(shownTip(readingOf(), catalogWith(['jobs']))).toBeUndefined()
  })

  it('shows the full store tip once a stock reaches the capacity', () => {
    const reading = readingOf({ stocks: { ...noCost, money: 990 } })

    expect(shownTip(reading, catalogWith(['fullStore']))).toBe('fullStore')
  })

  it('shows no full store tip while every stock is under the capacity', () => {
    expect(shownTip(readingOf(), catalogWith(['fullStore']))).toBeUndefined()
  })

  it('refuses a read before the town was stored', () => {
    const reading = { ...readingOf(), at: Instant.fromEpochMilliseconds(0) }

    expect(tipOf(reading, catalogWith(['office']))).toMatchObject({
      ok: false,
      error: { kind: 'InstantBeforeStored' },
    })
  })
})
