import type { CampTier } from '@mygame/domain'

export const isCampTier = (tier: number): tier is CampTier => tier === 1 || tier === 2 || tier === 3
