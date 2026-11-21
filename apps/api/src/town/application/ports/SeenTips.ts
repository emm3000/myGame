import type { PlayerId, TipKind } from '@mygame/domain'

export interface SeenTips {
  markSeen(playerId: PlayerId, tip: TipKind): Promise<void>
}
