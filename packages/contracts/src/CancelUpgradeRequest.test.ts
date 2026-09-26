import { describe, expect, it } from 'vitest'
import { CancelUpgradeRequestSchema } from './index'

describe('CancelUpgradeRequestSchema', () => {
  it('parses the building and the target level the path names', () => {
    expect(CancelUpgradeRequestSchema.parse({ building: 'sawmill', targetLevel: '2' })).toEqual({
      building: 'sawmill',
      targetLevel: 2,
    })
  })

  it('rejects a building the wire does not name', () => {
    expect(
      CancelUpgradeRequestSchema.safeParse({ building: 'castle', targetLevel: '1' }).success,
    ).toBe(false)
  })

  it('rejects a target level below one or not whole', () => {
    const targetLevels = ['0', '-1', '1.5', 'uno', '']
    expect(
      targetLevels.map(
        (targetLevel) =>
          CancelUpgradeRequestSchema.safeParse({ building: 'sawmill', targetLevel }).success,
      ),
    ).toEqual([false, false, false, false, false])
  })
})
