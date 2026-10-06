import { describe, expect, it } from 'vitest'
import { HintKindSchema } from './index'

describe('HintKindSchema', () => {
  it('names the hints in the order the lord meets them', () => {
    expect(HintKindSchema.options).toEqual([
      'peasants',
      'seasons',
      'queue',
      'library',
      'barracks',
      'marches',
      'fullStore',
    ])
  })

  it('rejects a hint it does not know', () => {
    expect(HintKindSchema.safeParse('dragons').success).toBe(false)
  })
})
