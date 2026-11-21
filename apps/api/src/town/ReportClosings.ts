import type { Instant, PlayerId } from '@mygame/domain'

export interface ReportClosings {
  serve(playerId: PlayerId, at: Instant): Promise<void>
  close(playerId: PlayerId): Promise<void>
  closedAt(playerId: PlayerId): Promise<Instant | undefined>
}
