import { describe, expect, it } from 'vitest'
import { TownOverviewSchema } from './index'

const stock = { amount: 300, ratePerHour: 12.5, capacity: 1000 }

const idle = { level: 0, nextLevel: null }

const lessonOne = {
  id: 'lesson-1',
  theme: 'A day in town',
  durationSeconds: 150,
  requiredSchoolLevel: 1,
  skill: { resource: 'food', ratePercent: 5 },
  isStudied: true,
  words: [
    { wordId: 'lesson-1-1', isRetained: true },
    { wordId: 'lesson-1-2', isRetained: false },
  ],
}

const earnedFood = {
  lessonId: 'lesson-1',
  resource: 'food',
  ratePercent: 5,
  earnedAt: '2026-11-23T09:10:00.000Z',
}

const lessonUnderStudy = {
  lessonId: 'lesson-1',
  startedAt: '2026-11-10T08:57:30.000Z',
  finishesAt: '2026-11-10T09:00:00.000Z',
}

const overview = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  name: 'Maple Falls',
  label: 'town',
  site: { region: 1, area: 1, site: 1 },
  terrain: 'fields',
  season: null,
  stocks: { money: stock, food: stock, power: stock, material: stock },
  people: { supplied: 10, free: 4, atWork: 6 },
  buildings: {
    homes: { level: 1, nextLevel: null },
    farm: idle,
    factory: idle,
    powerStation: idle,
    storage: idle,
    school: { level: 1, nextLevel: null },
    office: idle,
  },
  work: { slot: null, waitingList: [], cap: 4 },
  lessons: [lessonOne],
  skills: [earnedFood],
  lessonSlot: lessonUnderStudy,
  readAt: '2026-11-10T08:58:00.000Z',
  ...overrides,
})

describe('TownOverviewSchema', () => {
  it('parses the lessons, the earned skills and the lesson under study', () => {
    expect(TownOverviewSchema.parse(overview())).toEqual(overview())
  })

  it('parses a school with no lesson under study', () => {
    expect(TownOverviewSchema.parse(overview({ lessonSlot: null })).lessonSlot).toBeNull()
  })

  it('rejects a lesson that still names a library level', () => {
    const { requiredSchoolLevel: _, ...withoutSchool } = lessonOne
    const lessons = [{ ...withoutSchool, requiredLibraryLevel: 1 }]

    expect(TownOverviewSchema.safeParse(overview({ lessons })).success).toBe(false)
  })

  it('rejects a lesson word that carries its lemma', () => {
    const words = [{ wordId: 'lesson-1-1', isRetained: false, lemma: 'home' }]

    expect(
      TownOverviewSchema.safeParse(overview({ lessons: [{ ...lessonOne, words }] })).success,
    ).toBe(false)
  })

  it('rejects a skill earned on a medieval resource', () => {
    const skills = [{ ...earnedFood, resource: 'gold' }]

    expect(TownOverviewSchema.safeParse(overview({ skills })).success).toBe(false)
  })

  it('rejects a lesson under study without its finish', () => {
    const { finishesAt: _, ...withoutFinish } = lessonUnderStudy

    expect(TownOverviewSchema.safeParse(overview({ lessonSlot: withoutFinish })).success).toBe(
      false,
    )
  })

  it('rejects an overview without its lessons', () => {
    const { lessons: _, ...withoutLessons } = overview()

    expect(TownOverviewSchema.safeParse(withoutLessons).success).toBe(false)
  })
})
