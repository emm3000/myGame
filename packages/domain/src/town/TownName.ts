import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'

export class TownName {
  private constructor(readonly value: string) {}

  static create(chosen: string): Result<TownName, DomainError> {
    const trimmed = chosen.trim()
    if (trimmed.length === 0) {
      return err({ kind: 'BlankTownName' })
    }
    return ok(new TownName(trimmed))
  }
}
