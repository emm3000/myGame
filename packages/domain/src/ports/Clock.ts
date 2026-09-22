import type { Instant } from '../time/Instant'

export interface Clock {
  now(): Instant
}
