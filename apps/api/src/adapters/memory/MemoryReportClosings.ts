import type { Instant, PlayerId } from '@mygame/domain'
import type { ReportClosings } from '../../town/ReportClosings'

export class MemoryReportClosings implements ReportClosings {
  private readonly closes = new Map<PlayerId, Instant>()

  async close(playerId: PlayerId, now: Instant): Promise<void> {
    const stored = this.closes.get(playerId)
    const isLater = stored === undefined || now.epochMilliseconds > stored.epochMilliseconds
    if (isLater) {
      this.closes.set(playerId, now)
    }
  }

  async closedAt(playerId: PlayerId): Promise<Instant | undefined> {
    return this.closes.get(playerId)
  }
}
