import { describe, expect, it } from 'vitest'
import { TownOverviewSchema } from '../index'
import { overview } from './TownOverview.testSupport'

describe('TownOverviewSchema next step', () => {
  it('reads the reviews with their count and the lessons to read first', () => {
    const nextStep = { kind: 'reviews', count: 3, readFirst: ['lesson-1'] }

    expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
  })

  it('refuses the reviews with none due', () => {
    const nextStep = { kind: 'reviews', count: 0, readFirst: [] }

    expect(TownOverviewSchema.safeParse(overview({ nextStep })).success).toBe(false)
  })

  it('reads a running lesson with the next goal', () => {
    const goal = { position: 1, count: 9, building: 'farm', level: 1, state: 'underway' }

    const read = TownOverviewSchema.parse(
      overview({ nextStep: { kind: 'lessonRunning', goal, text: null } }),
    )

    expect(read.nextStep).toEqual({ kind: 'lessonRunning', goal, text: null })
  })

  it('reads a running lesson with no goal', () => {
    const nextStep = { kind: 'lessonRunning', goal: null, text: null }

    expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
  })

  it('refuses a running lesson with a field it does not carry', () => {
    const nextStep = { kind: 'lessonRunning', goal: null, text: null, building: 'farm' }

    expect(TownOverviewSchema.safeParse(overview({ nextStep })).success).toBe(false)
  })

  it('reads the lesson to study by its id', () => {
    const nextStep = { kind: 'lessonToStudy', lessonId: 'lesson-2' }

    expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
  })

  it('reads a due check by its band and week', () => {
    const nextStep = { kind: 'holdoutCheck', band: 1, week: 8 }

    expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
  })

  it('refuses a check on a week the holdout lacks', () => {
    const nextStep = { kind: 'holdoutCheck', band: 1, week: 12 }

    expect(TownOverviewSchema.safeParse(overview({ nextStep })).success).toBe(false)
  })

  it('reads a released lesson by its id, band and set', () => {
    const nextStep = { kind: 'releasedLesson', lessonId: 'released-1-2', band: 1, position: 2 }

    expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
  })

  it('refuses a released lesson numbered from 0', () => {
    const nextStep = { kind: 'releasedLesson', lessonId: 'released-1-0', band: 1, position: 0 }

    expect(TownOverviewSchema.safeParse(overview({ nextStep })).success).toBe(false)
  })

  it('reads caught up with no goal', () => {
    const nextStep = { kind: 'caughtUp', reason: 'lessonsDone', goal: null, text: null }

    expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
  })

  it('reads caught up with a pending goal and what it misses', () => {
    const goal = {
      position: 2,
      count: 9,
      building: 'factory',
      level: 1,
      state: 'pending',
      missing: { resources: { money: 0, food: 0, power: 0, material: 30 }, people: 1 },
    }

    const read = TownOverviewSchema.parse(
      overview({ nextStep: { kind: 'caughtUp', reason: 'learningCap', goal, text: null } }),
    )

    expect(read.nextStep).toEqual({ kind: 'caughtUp', reason: 'learningCap', goal, text: null })
  })

  it('reads caught up with a goal underway', () => {
    const goal = { position: 1, count: 9, building: 'farm', level: 1, state: 'underway' }

    const read = TownOverviewSchema.parse(
      overview({ nextStep: { kind: 'caughtUp', reason: 'learningCap', goal, text: null } }),
    )

    expect(read.nextStep).toEqual({ kind: 'caughtUp', reason: 'learningCap', goal, text: null })
  })

  it.each(['learningCap', 'schoolTooLow', 'lessonsDone'])(
    'reads caught up for the reason %s',
    (reason) => {
      const nextStep = { kind: 'caughtUp', reason, goal: null, text: null }

      expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
    },
  )

  it('refuses caught up without its reason', () => {
    const nextStep = { kind: 'caughtUp', goal: null, text: null }

    expect(TownOverviewSchema.safeParse(overview({ nextStep })).success).toBe(false)
  })

  it('refuses caught up for a reason it does not know', () => {
    const nextStep = { kind: 'caughtUp', reason: 'slotBusy', goal: null, text: null }

    expect(TownOverviewSchema.safeParse(overview({ nextStep })).success).toBe(false)
  })

  it('reads caught up with the newest text by its id and title', () => {
    const nextStep = {
      kind: 'caughtUp',
      reason: 'learningCap',
      goal: null,
      text: { id: 'text-1', title: 'A New Course' },
    }

    expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
  })

  it('reads a running lesson with the newest text', () => {
    const nextStep = {
      kind: 'lessonRunning',
      goal: null,
      text: { id: 'text-1', title: 'A New Course' },
    }

    expect(TownOverviewSchema.parse(overview({ nextStep })).nextStep).toEqual(nextStep)
  })

  it('refuses caught up without its text', () => {
    const nextStep = { kind: 'caughtUp', reason: 'lessonsDone', goal: null }

    expect(TownOverviewSchema.safeParse(overview({ nextStep })).success).toBe(false)
  })

  it('refuses caught up without its goal', () => {
    const nextStep = { kind: 'caughtUp', reason: 'lessonsDone', text: null }

    expect(TownOverviewSchema.safeParse(overview({ nextStep })).success).toBe(false)
  })

  it('refuses a goal underway that names what it misses', () => {
    const goal = {
      position: 1,
      count: 9,
      building: 'farm',
      level: 1,
      state: 'underway',
      missing: { resources: { money: 0, food: 0, power: 0, material: 0 }, people: 0 },
    }

    const parsed = TownOverviewSchema.safeParse(
      overview({ nextStep: { kind: 'caughtUp', reason: 'learningCap', goal, text: null } }),
    )

    expect(parsed.success).toBe(false)
  })

  it('refuses a goal at position 0', () => {
    const goal = { position: 0, count: 9, building: 'farm', level: 1, state: 'underway' }

    const parsed = TownOverviewSchema.safeParse(
      overview({ nextStep: { kind: 'caughtUp', reason: 'learningCap', goal, text: null } }),
    )

    expect(parsed.success).toBe(false)
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
