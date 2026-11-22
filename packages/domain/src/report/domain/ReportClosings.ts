import type { PlayerId } from '#player/PlayerId'
import type { Instant } from '#time/Instant'

export interface ReportClosings {
  serve(playerId: PlayerId, at: Instant): Promise<void>
  close(playerId: PlayerId): Promise<void>
  closedAt(playerId: PlayerId): Promise<Instant | undefined>
}
