import { type Clock, Instant } from '@mygame/domain'

export class SystemClock implements Clock {
  now(): Instant {
    return Instant.fromEpochMilliseconds(Date.now())
  }
}
