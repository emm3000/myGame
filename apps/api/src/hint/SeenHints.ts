import type { HintKind } from '@mygame/contracts'
import type { PlayerId } from '@mygame/domain'

export interface SeenHints {
  markSeen(playerId: PlayerId, hint: HintKind): Promise<void>
  seenHintsOf(playerId: PlayerId): Promise<ReadonlyArray<HintKind>>
}
