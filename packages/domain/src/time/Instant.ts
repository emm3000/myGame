import type { Duration } from './Duration'

const MILLISECONDS_PER_SECOND = 1_000

export class Instant {
  private constructor(readonly epochMilliseconds: number) {}

  static fromEpochMilliseconds(epochMilliseconds: number): Instant {
    return new Instant(epochMilliseconds)
  }

  plus(duration: Duration): Instant {
    return new Instant(this.epochMilliseconds + duration.seconds * MILLISECONDS_PER_SECOND)
  }

  secondsSince(earlier: Instant): number {
    return (this.epochMilliseconds - earlier.epochMilliseconds) / MILLISECONDS_PER_SECOND
  }
}
