import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'

export class FiefName {
  private constructor(readonly value: string) {}

  static create(chosen: string): Result<FiefName, DomainError> {
    const trimmed = chosen.trim()
    if (trimmed.length === 0) {
      return err({ kind: 'BlankFiefName' })
    }
    return ok(new FiefName(trimmed))
  }
}
