import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'

export const deriveFreePeasants = (
  suppliedPeasants: number,
  occupiedPeasants: number,
): Result<number, DomainError> => {
  const freePeasants = suppliedPeasants - occupiedPeasants
  if (freePeasants < 0) {
    return err({ kind: 'NegativeFreePeasants', suppliedPeasants, occupiedPeasants })
  }
  return ok(freePeasants)
}
