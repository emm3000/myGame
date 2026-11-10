import { describe, expect, it } from 'vitest'
import { TownNewsItemSchema } from './index'

const occurredAt = '2026-11-05T08:03:00.000Z'

const refund = { money: 90, food: 0, power: 0, material: 120 }

const site = { region: 1, area: 2, site: 3 }

const everyKind: ReadonlyArray<Record<string, unknown>> = [
  { kind: 'buildingWorkFinished', params: { building: 'farm', level: 1 }, occurredAt },
  { kind: 'buildingWorkStopped', params: { building: 'homes', level: 2, refund }, occurredAt },
  { kind: 'lessonStudied', params: { lessonId: 'lesson-1' }, occurredAt },
  { kind: 'lessonStopped', params: { lessonId: 'lesson-2' }, occurredAt },
  {
    kind: 'skillEarned',
    params: { lessonId: 'lesson-1', resource: 'food', ratePercent: 5 },
    occurredAt,
  },
  { kind: 'hiringDelivered', params: { hire: 'worker', count: 4 }, occurredAt },
  {
    kind: 'hiringStopped',
    params: { hire: 'truck', delivered: 1, stopped: 2, refund },
    occurredAt,
  },
  { kind: 'jobBack', params: { site, pay: refund }, occurredAt },
  { kind: 'jobCalledBack', params: { site, pay: refund }, occurredAt },
  { kind: 'cleanUpDone', params: { site, reward: refund }, occurredAt },
  { kind: 'cleanUpFailed', params: { site }, occurredAt },
  { kind: 'becameCity', occurredAt },
]

describe('TownNewsItemSchema', () => {
  it.each(everyKind.map((item) => [item.kind, item] as const))('parses %s', (_kind, item) => {
    expect(TownNewsItemSchema.parse(item)).toEqual(item)
  })

  it('rejects an item that carries a line of prose', () => {
    const item = { ...everyKind[0], message: 'The farm reached level 1.' }

    expect(TownNewsItemSchema.safeParse(item).success).toBe(false)
  })

  it('rejects a finished work without its level', () => {
    const item = { kind: 'buildingWorkFinished', params: { building: 'farm' }, occurredAt }

    expect(TownNewsItemSchema.safeParse(item).success).toBe(false)
  })

  it('rejects params on the town becoming a city', () => {
    const item = { kind: 'becameCity', params: {}, occurredAt }

    expect(TownNewsItemSchema.safeParse(item).success).toBe(false)
  })

  it('rejects a medieval building', () => {
    const item = {
      kind: 'buildingWorkFinished',
      params: { building: 'sawmill', level: 1 },
      occurredAt,
    }

    expect(TownNewsItemSchema.safeParse(item).success).toBe(false)
  })

  it('rejects an item without its instant', () => {
    const item = { kind: 'becameCity' }

    expect(TownNewsItemSchema.safeParse(item).success).toBe(false)
  })
})
