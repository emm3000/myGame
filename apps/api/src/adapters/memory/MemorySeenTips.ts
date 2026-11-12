import { type PlayerId, type TipKind, tipKinds } from '@mygame/domain'
import type { SeenTips } from '../../town/SeenTips'

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
