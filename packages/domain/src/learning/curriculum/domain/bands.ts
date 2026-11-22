import type { DomainError } from '#DomainError'
import { err, ok, type Result } from '#Result'
import type { Band } from './Band'

export const BANDS: ReadonlyArray<Band> = [1, 2, 3]

export const bandOf = (band: number): Result<Band, DomainError> => {
  const known = BANDS.find((candidate) => candidate === band)
  return known === undefined ? err({ kind: 'UnknownBand', band }) : ok(known)
}

export const laterBandOf = (band: Band): Band | undefined => BANDS.find((later) => later > band)
