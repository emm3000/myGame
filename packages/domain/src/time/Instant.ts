import type { Duration } from './Duration'

export class Instant {
  private constructor(readonly epochMilliseconds: number) {}

  static fromEpochMilliseconds(epochMilliseconds: number): Instant {
    return new Instant(epochMilliseconds)
  }

  plus(duration: Duration): Instant {
    return new Instant(this.epochMilliseconds + duration.seconds * 1000)
  }

  secondsSince(earlier: Instant): number {
    return (this.epochMilliseconds - earlier.epochMilliseconds) / 1000
  }
}
