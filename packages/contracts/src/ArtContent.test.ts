import { describe, expect, it } from 'vitest'
import { ArtContentSchema } from './index'

const smithingLevelOne = {
  level: 1,
  cost: { wood: 0, stone: 60, iron: 120, gold: 40, food: 0 },
  durationSeconds: 1800,
  requiredLibraryLevel: 1,
  effect: { ratePercent: 5 },
}

const smithingContent = (levels: unknown[]): unknown => ({
  art: 'smithing',
  resource: 'iron',
  levels,
})

describe('ArtContentSchema', () => {
  it('parses a smithing level with its library requirement and iron percent', () => {
    expect(ArtContentSchema.parse(smithingContent([smithingLevelOne]))).toEqual(
      smithingContent([smithingLevelOne]),
    )
  })

  it('rejects an art level that requires no library', () => {
    const levelWithoutLibrary = { ...smithingLevelOne, requiredLibraryLevel: 0 }

    expect(ArtContentSchema.safeParse(smithingContent([levelWithoutLibrary])).success).toBe(false)
  })

  it('rejects an art the arts do not name', () => {
    const alchemyContent = { art: 'alchemy', resource: 'gold', levels: [smithingLevelOne] }

    expect(ArtContentSchema.safeParse(alchemyContent).success).toBe(false)
  })
})
