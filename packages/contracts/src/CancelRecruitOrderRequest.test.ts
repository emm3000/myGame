import { describe, expect, it } from 'vitest'
import { CancelRecruitOrderRequestSchema } from './index'

describe('CancelRecruitOrderRequestSchema', () => {
  it('parses the unit and the start the path names', () => {
    expect(
      CancelRecruitOrderRequestSchema.parse({
        unit: 'infantry',
        startedAt: '2026-09-22T08:10:00.000Z',
      }),
    ).toEqual({ unit: 'infantry', startedAt: '2026-09-22T08:10:00.000Z' })
  })

  it('rejects a start that is not an instant', () => {
    const starts = ['2026-09-22', 'ayer', '', '2026-09-22T08:10:00']
    expect(
      starts.map(
        (startedAt) =>
          CancelRecruitOrderRequestSchema.safeParse({ unit: 'infantry', startedAt }).success,
      ),
    ).toEqual([false, false, false, false])
  })

  it('rejects an unknown unit', () => {
    expect(
      CancelRecruitOrderRequestSchema.safeParse({
        unit: 'cavalry',
        startedAt: '2026-09-22T08:10:00.000Z',
      }).success,
    ).toBe(false)
  })
})
