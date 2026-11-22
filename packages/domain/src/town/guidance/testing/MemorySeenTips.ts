import type { PlayerId } from '#player/PlayerId'
import type { SeenTips } from '../domain/SeenTips'
import type { TipKind } from '../domain/TipKind'
import { tipKinds } from '../domain/tipKinds'

export class MemorySeenTips implements SeenTips {
  private readonly seen = new Map<PlayerId, ReadonlySet<TipKind>>()

  async markSeen(playerId: PlayerId, tip: TipKind): Promise<void> {
    this.seen.set(playerId, new Set([...(this.seen.get(playerId) ?? []), tip]))
  }

  async seenTipsOf(playerId: PlayerId): Promise<ReadonlyArray<TipKind>> {
    const seen = this.seen.get(playerId) ?? new Set()
    return tipKinds.filter((tip) => seen.has(tip))
  }
}
