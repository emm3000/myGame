import type { Instant } from '@mygame/domain'

export const isoOf = (instant: Instant): string => new Date(instant.epochMilliseconds).toISOString()
