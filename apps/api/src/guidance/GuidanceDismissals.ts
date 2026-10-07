import type { FiefOfPlayer, Instant } from '@mygame/domain'

export type GuidanceDismissal = 'dismissed' | 'fiefNotFound'

export interface GuidanceDismissals {
  dismiss(fiefOfPlayer: FiefOfPlayer, now: Instant): Promise<GuidanceDismissal>
}
