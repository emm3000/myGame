import type { TownOverview } from '@mygame/contracts'
import { expect, it } from 'vitest'
import { knownTown } from '../auth/stubApiClient.testSupport'
import { registeredBetween } from './registeredBetween'

const withPlaceAt = (
  overview: TownOverview,
  place: keyof TownOverview['buildings'],
  level: number,
): TownOverview => ({
  ...overview,
  buildings: { ...overview.buildings, [place]: { ...overview.buildings[place], level } },
})

const withRetained = (count: number, total: number): TownOverview => ({
  ...knownTown,
  learning: { ...knownTown.learning, retainedWords: { count, total } },
})

const withFoodSkill = (ratePerHour: number): TownOverview => ({
  ...knownTown,
  stocks: { ...knownTown.stocks, food: { ...knownTown.stocks.food, ratePerHour } },
  skills: [{ lessonId: 'lesson-1', resource: 'food', ratePercent: 5, earnedAt: knownTown.readAt }],
})

it('registers nothing when two reads agree', () => {
  expect(registeredBetween(knownTown, { ...knownTown })).toEqual({
    places: [],
    retainedWords: undefined,
    rates: [],
  })
})

it('registers a level finishing with the level it held', () => {
  const held = withPlaceAt(knownTown, 'homes', 2)

  expect(registeredBetween(held, withPlaceAt(held, 'homes', 3)).places).toEqual([
    { place: 'homes', levelBefore: 2, level: 3 },
  ])
})

it('registers a place first built from level 0', () => {
  expect(registeredBetween(knownTown, withPlaceAt(knownTown, 'farm', 1)).places).toEqual([
    { place: 'farm', levelBefore: 0, level: 1 },
  ])
})

it('registers no place whose level fell', () => {
  const held = withPlaceAt(knownTown, 'homes', 2)

  expect(registeredBetween(held, withPlaceAt(held, 'homes', 1)).places).toEqual([])
})

it('registers a word retained', () => {
  expect(registeredBetween(withRetained(1, 5), withRetained(2, 5)).retainedWords).toEqual({
    countBefore: 1,
    count: 2,
    total: 5,
  })
})

it('registers no ring move when a retained word falls back', () => {
  expect(registeredBetween(withRetained(2, 5), withRetained(1, 5)).retainedWords).toBeUndefined()
})

it('registers no ring move when the ring counts another lesson', () => {
  expect(registeredBetween(withRetained(4, 5), withRetained(5, 6)).retainedWords).toBeUndefined()
})

it('registers no ring move while either read holds no ring', () => {
  expect(registeredBetween(knownTown, withRetained(1, 5)).retainedWords).toBeUndefined()
})

it('registers a skill earned with the rate before and after', () => {
  expect(registeredBetween(knownTown, withFoodSkill(126)).rates).toEqual([
    { resource: 'food', ratePerHourBefore: 120, ratePerHourAfter: 126 },
  ])
})

it('registers no rate for a skill already held', () => {
  const held = withFoodSkill(126)

  expect(registeredBetween(held, { ...held, readAt: '2026-11-10T09:05:00.000Z' }).rates).toEqual([])
})
