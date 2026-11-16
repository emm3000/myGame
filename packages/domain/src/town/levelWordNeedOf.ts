import type { WordNeed } from './WordNeed'

export type NeededWordKind = 'stable' | 'retained'

export type LevelWordNeed = {
  readonly count: number
  readonly standing: NeededWordKind
}

export const levelWordNeedOf = (level: number, need: WordNeed): LevelWordNeed | null => {
  if (level < need.fromLevel) {
    return null
  }
  return {
    count: need.perLevel * (level - need.fromLevel + 1),
    standing: level < need.retainedFromLevel ? 'stable' : 'retained',
  }
}
