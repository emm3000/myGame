import type { Instant, PlayerId } from '@mygame/domain'
import type { DigestAcknowledgements } from '../../digest/DigestAcknowledgements'

export class MemoryDigestAcknowledgements implements DigestAcknowledgements {
  private readonly acknowledged = new Map<PlayerId, Instant>()

  async acknowledge(playerId: PlayerId, now: Instant): Promise<void> {
    this.acknowledged.set(playerId, now)
  }

  async acknowledgedAt(playerId: PlayerId): Promise<Instant | undefined> {
    return this.acknowledged.get(playerId)
  }
}
