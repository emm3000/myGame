import { describe, expect, it } from 'vitest'
import { ReportSchema, TownNewsFeedSchema } from './index'

const recall = {
  wordId: 'lesson-1-1',
  lessonId: 'lesson-1',
  dueAt: '2026-11-12T09:10:00.000Z',
  mode: 'recall',
  gloss: 'hogar',
  gappedFrame: 'I go ___ after work.',
}

const finishedFarm = {
  kind: 'buildingWorkFinished',
  params: { building: 'farm', level: 1 },
  occurredAt: '2026-11-05T08:03:00.000Z',
}

const report = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  dueCount: 1,
  due: [recall],
  readFirst: [],
  nextDueAt: null,
  news: [finishedFarm],
  ...overrides,
})

describe('ReportSchema', () => {
  it('parses the reviews due and the news', () => {
    expect(ReportSchema.parse(report())).toEqual(report())
  })

  it('parses the lessons to read first', () => {
    const readFirst = ['lesson-1', 'lesson-2']

    expect(ReportSchema.parse(report({ readFirst })).readFirst).toEqual(readFirst)
  })

  it('rejects a report without its lessons to read first', () => {
    const { readFirst: _, ...withoutReadFirst } = report()

    expect(ReportSchema.safeParse(withoutReadFirst).success).toBe(false)
  })

  it('reads the next review instant', () => {
    const nextDueAt = '2026-11-10T09:10:00.000Z'

    expect(ReportSchema.parse(report({ nextDueAt })).nextDueAt).toBe(nextDueAt)
  })

  it('refuses a report without its next review instant', () => {
    const { nextDueAt: _, ...withoutNextDueAt } = report()

    expect(ReportSchema.safeParse(withoutNextDueAt).success).toBe(false)
  })

  it('parses a report with no news', () => {
    expect(ReportSchema.parse(report({ news: [] })).news).toEqual([])
  })

  it('rejects a report without its count of reviews due', () => {
    const { dueCount: _, ...withoutCount } = report()

    expect(ReportSchema.safeParse(withoutCount).success).toBe(false)
  })

  it('rejects a medieval chronicle event among the news', () => {
    const news = [
      {
        kind: 'upgradeFinished',
        building: 'sawmill',
        level: 1,
        occurredAt: '2026-11-05T08:03:00.000Z',
      },
    ]

    expect(ReportSchema.safeParse(report({ news })).success).toBe(false)
  })
})

describe('TownNewsFeedSchema', () => {
  it('parses the town news', () => {
    expect(TownNewsFeedSchema.parse({ items: [finishedFarm] })).toEqual({ items: [finishedFarm] })
  })

  it('rejects more than the 100 kept items', () => {
    const items = Array.from({ length: 101 }, () => finishedFarm)

    expect(TownNewsFeedSchema.safeParse({ items }).success).toBe(false)
  })
})
