import type { Instant, PlayerId } from '@mygame/domain'

export interface ReportClosings {
  close(playerId: PlayerId, now: Instant): Promise<void>
  closedAt(playerId: PlayerId): Promise<Instant | undefined>
}
