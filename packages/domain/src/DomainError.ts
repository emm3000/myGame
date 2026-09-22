import type { Instant } from './time/Instant'

export type DomainError =
  | { readonly kind: 'NegativeDuration'; readonly seconds: number }
  | { readonly kind: 'InstantBeforeStored'; readonly storedAt: Instant; readonly now: Instant }
