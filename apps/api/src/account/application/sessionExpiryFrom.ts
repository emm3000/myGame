import { Instant } from '@mygame/domain'

export const sessionLifetimeSeconds = 30 * 24 * 60 * 60

const millisecondsPerSecond = 1_000

export const sessionExpiryFrom = (now: Instant): Instant =>
  Instant.fromEpochMilliseconds(
    now.epochMilliseconds + sessionLifetimeSeconds * millisecondsPerSecond,
  )
