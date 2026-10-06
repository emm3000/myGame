import type { Instant, PlayerId } from '@mygame/domain'

export interface DigestAcknowledgements {
  acknowledge(playerId: PlayerId, now: Instant): Promise<void>
  acknowledgedAt(playerId: PlayerId): Promise<Instant | undefined>
}
