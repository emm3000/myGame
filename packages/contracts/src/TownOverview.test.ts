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
    { wordId: 'lesson-1-1', standing: 'retained', reading: null },
    {
      wordId: 'lesson-1-2',
      standing: 'recognize',
      reading: { word: 'school', gloss: 'escuela', frame: 'We are at school.' },
    },
  ],
}

const earnedFood = {
  lessonId: 'lesson-1',
  resource: 'food',
  ratePercent: 5,
  earnedAt: '2026-11-23T09:10:00.000Z',
}

const workerTerms = {
  cost: { money: 40, food: 0, power: 0, material: 0 },
  secondsPerHire: 60,
  people: 1,
  requiredOfficeLevel: 1,
}

const truckTerms = {
  cost: { money: 80, food: 40, power: 40, material: 60 },
  secondsPerHire: 180,
  people: 1,
  requiredOfficeLevel: 3,
}

const openOrder = {
  hire: 'worker',
  count: 3,
  delivered: 1,
  secondsPerHire: 60,
  startedAt: '2026-11-10T08:55:00.000Z',
  endsAt: '2026-11-10T08:58:00.000Z',
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
  hiring: {
    order: null,
    hires: { worker: 2, truck: 0 },
    terms: { worker: workerTerms, truck: truckTerms },
  },
  lessons: [lessonOne],
  skills: [earnedFood],
  lessonSlot: lessonUnderStudy,
  learning: { cap: 15, inLearning: 5, retainedWords: null },
  nextStep: { kind: 'caughtUp' },
  nextDueAt: null,
  readAt: '2026-11-10T08:58:00.000Z',
  ...overrides,
})

describe('TownOverviewSchema', () => {
  it('parses an open hiring order with its delivered count', () => {
    const hiring = {
      order: openOrder,
      hires: { worker: 1, truck: 0 },
      terms: { worker: workerTerms, truck: truckTerms },
    }

    expect(TownOverviewSchema.parse(overview({ hiring })).hiring).toEqual(hiring)
  })

  it('rejects hires missing a kind', () => {
    const hiring = {
      order: null,
      hires: { worker: 1 },
      terms: { worker: workerTerms, truck: truckTerms },
    }

    expect(TownOverviewSchema.safeParse(overview({ hiring })).success).toBe(false)
  })

  it('rejects a hiring order of no hires', () => {
    const hiring = {
      order: { ...openOrder, count: 0, delivered: 0 },
      hires: { worker: 0, truck: 0 },
      terms: { worker: workerTerms, truck: truckTerms },
    }

    expect(TownOverviewSchema.safeParse(overview({ hiring })).success).toBe(false)
  })

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

  it("rejects a lemma outside a lesson word's reading", () => {
    const words = [{ wordId: 'lesson-1-1', standing: 'recall', reading: null, lemma: 'home' }]

    expect(
      TownOverviewSchema.safeParse(overview({ lessons: [{ ...lessonOne, words }] })).success,
    ).toBe(false)
  })

  it('rejects a standing the school path does not have', () => {
    const words = [{ wordId: 'lesson-1-1', standing: 'learned', reading: null }]

    expect(
      TownOverviewSchema.safeParse(overview({ lessons: [{ ...lessonOne, words }] })).success,
    ).toBe(false)
  })

  it('rejects a reading without its frame', () => {
    const reading = { word: 'home', gloss: 'hogar' }
    const words = [{ wordId: 'lesson-1-1', standing: 'notStarted', reading }]

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

  it('rejects an overview without its learning load', () => {
    const { learning: _, ...withoutLearning } = overview()

    expect(TownOverviewSchema.safeParse(withoutLearning).success).toBe(false)
  })

  it('rejects a fractional count of words in learning', () => {
    const learning = { cap: 15, inLearning: 2.5, retainedWords: null }

    expect(TownOverviewSchema.safeParse(overview({ learning })).success).toBe(false)
  })

  it('accepts a count of retained words', () => {
    const learning = { cap: 15, inLearning: 5, retainedWords: { count: 3, total: 5 } }

    expect(TownOverviewSchema.safeParse(overview({ learning })).success).toBe(true)
  })

  it('rejects a learning load without its retained words', () => {
    const learning = { cap: 15, inLearning: 5 }

    expect(TownOverviewSchema.safeParse(overview({ learning })).success).toBe(false)
  })

  it('rejects retained words with a total of none', () => {
    const learning = { cap: 15, inLearning: 5, retainedWords: { count: 0, total: 0 } }

    expect(TownOverviewSchema.safeParse(overview({ learning })).success).toBe(false)
  })

  it('rejects an overview without its lessons', () => {
    const { lessons: _, ...withoutLessons } = overview()

    expect(TownOverviewSchema.safeParse(withoutLessons).success).toBe(false)
  })
})

describe('TownOverviewSchema next step', () => {
  it('reads the reviews with their count and the lessons to read first', () => {
    const nextStep = { kind: 'reviews', count: 3, readFirst: ['lesson-1'] }

    expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
  })

  it('refuses the reviews with none due', () => {
    const nextStep = { kind: 'reviews', count: 0, readFirst: [] }

    expect(TownOverviewSchema.safeParse(overview({ nextStep })).success).toBe(false)
  })

  it('reads a running lesson with the producer to build', () => {
    const nextStep = { kind: 'lessonRunning', producer: 'powerStation' }

    expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
  })

  it('reads a running lesson with no producer', () => {
    const nextStep = { kind: 'lessonRunning', producer: null }

    expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
  })

  it('refuses a producer that makes no resource', () => {
    const nextStep = { kind: 'lessonRunning', producer: 'school' }

    expect(TownOverviewSchema.safeParse(overview({ nextStep })).success).toBe(false)
  })

  it('reads the lesson to study by its id', () => {
    const nextStep = { kind: 'lessonToStudy', lessonId: 'lesson-2' }

    expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
  })

  it('refuses a field on caughtUp', () => {
    const nextStep = { kind: 'caughtUp', goal: null }

    expect(TownOverviewSchema.safeParse(overview({ nextStep })).success).toBe(false)
  })

  it('refuses an overview without its next step', () => {
    const { nextStep: _, ...withoutNextStep } = overview()

    expect(TownOverviewSchema.safeParse(withoutNextStep).success).toBe(false)
  })

  it('reads the next review instant', () => {
    const nextDueAt = '2026-11-10T09:10:00.000Z'

    expect(TownOverviewSchema.parse(overview({ nextDueAt })).nextDueAt).toBe(nextDueAt)
  })

  it('refuses an overview without its next review instant', () => {
    const { nextDueAt: _, ...withoutNextDueAt } = overview()

    expect(TownOverviewSchema.safeParse(withoutNextDueAt).success).toBe(false)
  })
})
