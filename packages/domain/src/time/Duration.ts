import { err, ok, type Result } from '../Result'
import type { DurationError } from './DurationError'

export class Duration {
  private constructor(readonly seconds: number) {}

  static ofSeconds(seconds: number): Result<Duration, DurationError> {
    if (seconds < 0) {
      return err({ kind: 'NegativeDuration', seconds })
    }
    return ok(new Duration(seconds))
  }
}
