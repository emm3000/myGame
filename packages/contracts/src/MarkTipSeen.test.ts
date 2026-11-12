import { describe, expect, it } from 'vitest'
import { MarkTipSeenSchema } from './index'

describe('MarkTipSeenSchema', () => {
  it('parses the tip the path names', () => {
    expect(MarkTipSeenSchema.parse({ tip: 'fullStore' })).toEqual({ tip: 'fullStore' })
  })

  it('rejects a tip the town does not know', () => {
    expect(MarkTipSeenSchema.safeParse({ tip: 'marches' }).success).toBe(false)
  })
})
