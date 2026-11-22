import type { PlayerId } from '#player/PlayerId'
import type { Instant } from '#time/Instant'
import { laterOf } from '#time/laterOf'
import type { ReportClosings } from '../domain/ReportClosings'

export class MemoryReportClosings implements ReportClosings {
  private readonly served = new Map<PlayerId, Instant>()
  private readonly closes = new Map<PlayerId, Instant>()

  async serve(playerId: PlayerId, at: Instant): Promise<void> {
    const stored = this.served.get(playerId)
    this.served.set(playerId, stored === undefined ? at : laterOf(stored, at))
  }

  async close(playerId: PlayerId): Promise<void> {
    const served = this.served.get(playerId)
    if (served === undefined) {
      return
    }
    const closed = this.closes.get(playerId)
    this.closes.set(playerId, closed === undefined ? served : laterOf(closed, served))
  }

  async closedAt(playerId: PlayerId): Promise<Instant | undefined> {
    return this.closes.get(playerId)
  }
}
