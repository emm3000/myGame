import type { HeldCard } from '../learning/HeldCard'
import type { WordId } from '../learning/Lesson'
import type { PlayerId } from '../player/PlayerId'
import type { CardRepository } from '../ports/CardRepository'
import { ok } from '../Result'

export type InMemoryCards = CardRepository & {
  heldCardOf(playerId: PlayerId, wordId: WordId): HeldCard | undefined
}

export type OwnedCard = HeldCard & {
  readonly playerId: PlayerId
}

export const inMemoryCards = (existing: ReadonlyArray<OwnedCard>): InMemoryCards => {
  const keyOf = (playerId: PlayerId, wordId: WordId): string => `${playerId}/${wordId}`
  const cards = new Map(existing.map((owned) => [keyOf(owned.playerId, owned.wordId), owned]))
  return {
    heldCardOf: (playerId, wordId) => cards.get(keyOf(playerId, wordId)),
    cardsOf: async (playerId) =>
      ok(
        [...cards.values()]
          .filter((owned) => owned.playerId === playerId)
          .map(({ wordId, card }) => ({ wordId, card })),
      ),
    save: async (playerId, held) => {
      cards.set(keyOf(playerId, held.wordId), { playerId, ...held })
      return ok(undefined)
    },
  }
}
