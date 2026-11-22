import type { Band } from '@mygame/domain'
import { bandOfRank } from './bandOfRank'

export const bandOfListedRank = (headword: string, rank: number): Band => {
  const band = bandOfRank(rank)
  if (!band.ok) {
    throw new Error(`Headword ${headword} ranks ${rank}, past the last band of ngsl-1.2.csv`)
  }
  return band.value
}
