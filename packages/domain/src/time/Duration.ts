import type { DomainError } from '../DomainError'
import { err, ok, type Result } from '../Result'

export class Duration {
  private constructor(readonly seconds: number) {}

  static ofSeconds(seconds: number): Result<Duration, DomainError> {
    if (seconds < 0) {
      return err({ kind: 'NegativeDuration', seconds })
    }
    return ok(new Duration(seconds))
  }
}
