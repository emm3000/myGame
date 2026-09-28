import { describe, expect, it } from 'vitest'
import { CancelStudyRequestSchema } from './index'

describe('CancelStudyRequestSchema', () => {
  it('parses the art and the target level the path names', () => {
    expect(CancelStudyRequestSchema.parse({ art: 'smithing', targetLevel: '2' })).toEqual({
      art: 'smithing',
      targetLevel: 2,
    })
  })

  it('rejects an art the wire does not name', () => {
    expect(CancelStudyRequestSchema.safeParse({ art: 'alchemy', targetLevel: '1' }).success).toBe(
      false,
    )
  })

  it('rejects a cancel path whose target level is not a whole count from one', () => {
    const targetLevels = ['0', '-1', '1.5', 'uno', '']
    expect(
      targetLevels.map(
        (targetLevel) =>
          CancelStudyRequestSchema.safeParse({ art: 'smithing', targetLevel }).success,
      ),
    ).toEqual([false, false, false, false, false])
  })
})
