import { type Band, bandOf, type DomainError, type Result } from '@mygame/domain'

const bandSize = 1000

export const bandOfRank = (rank: number): Result<Band, DomainError> =>
  bandOf(Math.ceil(rank / bandSize))

export const isRankOfBand = (rank: number, band: Band): boolean => {
  const ranked = bandOfRank(rank)
  return ranked.ok && ranked.value === band
}
