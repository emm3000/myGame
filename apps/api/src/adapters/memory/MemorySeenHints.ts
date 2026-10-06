import { type HintKind, HintKindSchema } from '@mygame/contracts'
import type { PlayerId } from '@mygame/domain'
import type { SeenHints } from '../../hint/SeenHints'

export class MemorySeenHints implements SeenHints {
  private readonly seen = new Map<PlayerId, ReadonlySet<HintKind>>()

  async markSeen(playerId: PlayerId, hint: HintKind): Promise<void> {
    this.seen.set(playerId, new Set([...(this.seen.get(playerId) ?? []), hint]))
  }

  async seenHintsOf(playerId: PlayerId): Promise<ReadonlyArray<HintKind>> {
    const seen = this.seen.get(playerId) ?? new Set()
    return HintKindSchema.options.filter((hint) => seen.has(hint))
  }
}
