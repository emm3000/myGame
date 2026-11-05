import type { Band } from '@mygame/domain'

const bandSize = 1000

export const bandOfRank = (rank: number): Band => Math.ceil(rank / bandSize)
