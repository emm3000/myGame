import { Instant } from '@mygame/domain'
import type { AccountTokenKind } from './AccountTokens'

const millisecondsPerHour = 60 * 60 * 1_000

const lifetimeHours: Readonly<Record<AccountTokenKind, number>> = {
  reset: 1,
  verify: 24,
}

export const accountTokenExpiryFrom = (kind: AccountTokenKind, now: Instant): Instant =>
  Instant.fromEpochMilliseconds(now.epochMilliseconds + lifetimeHours[kind] * millisecondsPerHour)
