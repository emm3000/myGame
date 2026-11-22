import type { PlayerId } from '#player/PlayerId'
import type { TipKind } from '../TipKind'

export interface SeenTips {
  markSeen(playerId: PlayerId, tip: TipKind): Promise<void>
}
