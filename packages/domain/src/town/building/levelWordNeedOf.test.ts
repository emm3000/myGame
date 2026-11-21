import { describe, expect, it } from 'vitest'
import { levelWordNeedOf } from './levelWordNeedOf'
import type { WordNeed } from './WordNeed'

const townNeed: WordNeed = { fromLevel: 3, perLevel: 10, retainedFromLevel: 7 }

describe('levelWordNeedOf', () => {
  it('needs no words at levels 1 and 2', () => {
    expect([1, 2].map((level) => levelWordNeedOf(level, townNeed))).toEqual([null, null])
  })

  it('needs 10 stable words at level 3 and 40 at level 6', () => {
    expect([3, 6].map((level) => levelWordNeedOf(level, townNeed))).toEqual([
      { count: 10, standing: 'stable' },
      { count: 40, standing: 'stable' },
    ])
  })

  it('needs 50 retained words at level 7 and 80 at level 10', () => {
    expect([7, 10].map((level) => levelWordNeedOf(level, townNeed))).toEqual([
      { count: 50, standing: 'retained' },
      { count: 80, standing: 'retained' },
    ])
  })
})
