import { describe, expect, it } from 'vitest'
import { CallJobBackSchema } from './index'

describe('CallJobBackSchema', () => {
  it('parses the instant the job was sent', () => {
    const target = { sentAt: '2026-11-10T08:55:00.000Z' }

    expect(CallJobBackSchema.parse(target)).toEqual(target)
  })

  it('rejects a send that is not an instant', () => {
    expect(CallJobBackSchema.safeParse({ sentAt: 'yesterday' }).success).toBe(false)
  })
})
