import { describe, expect, it } from 'vitest'
import { CancelUpgradeRequestSchema } from './index'

describe('CancelUpgradeRequestSchema', () => {
  it('parses the position of the slot as zero', () => {
    expect(CancelUpgradeRequestSchema.parse({ position: '0' })).toEqual({ position: 0 })
  })

  it('parses the position of a waiting entry', () => {
    expect(CancelUpgradeRequestSchema.parse({ position: '3' })).toEqual({ position: 3 })
  })

  it('rejects a position that is not a whole count', () => {
    const positions = ['-1', '1.5', 'uno', '']
    expect(
      positions.map((position) => CancelUpgradeRequestSchema.safeParse({ position }).success),
    ).toEqual([false, false, false, false])
  })
})
